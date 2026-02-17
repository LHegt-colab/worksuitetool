import { useState, useEffect } from 'react';
import type { Meeting, NewMeeting } from './api';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { TagSelector } from '../tags/TagSelector';
import { decisionsApi, type Decision } from '../decisions/api';
import { actionsApi, type Action, type NewAction } from '../actions/api';
import { ActionForm } from '../actions/ActionForm';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface MeetingFormProps {
    initialData?: Meeting;
    onSubmit: (data: NewMeeting) => Promise<void>;
    onCancel: () => void;
    onDelete?: (id: string) => Promise<void>;
    isOpen: boolean;
}

export function MeetingForm({ initialData, onSubmit, onCancel, onDelete, isOpen }: MeetingFormProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<NewMeeting>({
        title: '',
        date_time: new Date().toISOString(),
        location: '',
        participants: '',
        notes: '',
        decisions: '', // Legacy field, kept for compatibility but UI will focus on relation
        tags: [],
        label_ids: [],
        recurrence_interval: null,
        recurrence_unit: null,
        recurrence_end_date: null,
    });

    // Local state
    const [datePart, setDatePart] = useState('');
    const [timePart, setTimePart] = useState('');
    const [endTimePart, setEndTimePart] = useState('');
    const [loading, setLoading] = useState(false);

    // Sub-items state
    const [decisionsList, setDecisionsList] = useState<Decision[]>([]);
    const [actionsList, setActionsList] = useState<Action[]>([]);
    const [newDecisionText, setNewDecisionText] = useState('');

    // Action Modal state
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    useEffect(() => {
        if (initialData) {
            const dt = new Date(initialData.date_time);
            setDatePart(dt.toISOString().split('T')[0]);
            setTimePart(dt.toTimeString().slice(0, 5));

            if (initialData.end_time) {
                const et = new Date(initialData.end_time);
                setEndTimePart(et.toTimeString().slice(0, 5));
            } else {
                // Default to 1 hour after start
                const et = new Date(dt.getTime() + 60 * 60 * 1000);
                setEndTimePart(et.toTimeString().slice(0, 5));
            }

            setFormData({
                title: initialData.title,
                date_time: initialData.date_time,
                end_time: initialData.end_time || null,
                location: initialData.location || '',
                participants: initialData.participants || '',
                notes: initialData.notes || '',
                decisions: initialData.decisions || '',
                tags: initialData.tags || [],
                label_ids: initialData.label_ids || [],
                recurrence_interval: initialData.recurrence_interval || null,
                recurrence_unit: initialData.recurrence_unit || null,
                recurrence_end_date: initialData.recurrence_end_date || null,
            });

            // Load sub-items
            loadSubItems(initialData.id);
        } else {
            const now = new Date();
            // Round up to next 30 min slot for UX
            now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);

            setDatePart(now.toISOString().split('T')[0]);
            setTimePart(now.toTimeString().slice(0, 5));

            const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour duration default
            setEndTimePart(end.toTimeString().slice(0, 5));

            setFormData({
                title: '',
                date_time: now.toISOString(),
                end_time: end.toISOString(),
                location: '',
                participants: '',
                notes: '',
                decisions: '',
                tags: [],
                label_ids: [],
                recurrence_interval: null,
                recurrence_unit: null,
                recurrence_end_date: null,
            });
            setDecisionsList([]);
            setActionsList([]);
        }
    }, [initialData, isOpen]);

    const loadSubItems = async (meetingId: string) => {
        try {
            const decisions = await decisionsApi.getDecisionsByMeeting(meetingId);
            setDecisionsList(decisions || []);

            // Fetch actions linking to this meeting
            // We use direct supabase call as we don't have getActionsByMeeting in api yet
            const { data: actions } = await supabase.from('actions').select('*').eq('meeting_id', meetingId);
            if (actions) setActionsList(actions as Action[]);
        } catch (error) {
            console.error("Failed to load sub items", error);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const startDateTime = new Date(`${datePart}T${timePart}:00`);
            const endDateTime = new Date(`${datePart}T${endTimePart}:00`);

            // Validate
            if (endDateTime <= startDateTime) {
                alert('End time must be after start time');
                setLoading(false);
                return;
            }

            // Base meeting object
            const baseMeeting = {
                ...formData,
                date_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                // Ensure recurrence interval is a number if present
                recurrence_interval: formData.recurrence_interval ? Number(formData.recurrence_interval) : null,
            };

            const meetingsToCreate = [baseMeeting];

            // Handle Recurrence Generation (Only for new meetings)
            if (!initialData && formData.recurrence_unit && formData.recurrence_interval && formData.recurrence_end_date) {
                const interval = Number(formData.recurrence_interval);
                const endDate = new Date(formData.recurrence_end_date);
                // Set end date to end of day to be inclusive
                endDate.setHours(23, 59, 59, 999);

                let nextStart = new Date(startDateTime);
                let nextEnd = new Date(endDateTime);
                const duration = nextEnd.getTime() - nextStart.getTime();

                // Safety limit to prevent infinite loops (e.g. 500 instances max)
                let count = 0;
                const MAX_INSTANCES = 365; // Allow year-round daily meetings

                while (true) {
                    // Calculate next date
                    if (formData.recurrence_unit === 'day') {
                        nextStart.setDate(nextStart.getDate() + interval);
                    } else if (formData.recurrence_unit === 'week') {
                        nextStart.setDate(nextStart.getDate() + (interval * 7));
                    } else if (formData.recurrence_unit === 'month') {
                        nextStart.setMonth(nextStart.getMonth() + interval);
                    } else if (formData.recurrence_unit === 'year') {
                        nextStart.setFullYear(nextStart.getFullYear() + interval);
                    }

                    // Update nextEnd based on the new nextStart + duration
                    nextEnd = new Date(nextStart.getTime() + duration);

                    // Check boundaries
                    if (nextStart > endDate || count >= MAX_INSTANCES) break;

                    meetingsToCreate.push({
                        ...baseMeeting,
                        date_time: nextStart.toISOString(),
                        end_time: nextEnd.toISOString(),
                    });
                    count++;
                }
            }

            // Pass single object or array to onSubmit
            // NOTE: We need to cast to any here because we are modifying the contract of onSubmit implicitly
            // The parent component (CalendarView) needs to handle this.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await onSubmit(meetingsToCreate as any);
            onCancel();
        } catch (error) {
            console.error('Error submitting meeting:', error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = (error as any)?.message || 'Unknown error';
            alert(`Failed to save meeting: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDecision = async () => {
        if (!initialData || !newDecisionText.trim() || !user) return;
        try {
            const newDecision = await decisionsApi.createDecision({
                description: newDecisionText,
                meeting_id: initialData.id,
                user_id: user.id
            });
            setDecisionsList([...decisionsList, newDecision]);
            setNewDecisionText('');
        } catch (e) {
            console.error("Failed to add decision", e);
            alert('Failed to add decision');
        }
    };

    const handleDeleteDecision = async (id: string) => {
        if (!confirm("Delete decision?")) return;
        try {
            await decisionsApi.deleteDecision(id);
            setDecisionsList(decisionsList.filter(d => d.id !== id));
        } catch (e) {
            console.error("Failed to delete decision", e);
        }
    };

    const handleCreateAction = async (data: NewAction) => {
        if (!initialData || !user) return;
        try {
            await actionsApi.createAction({
                ...data,
                meeting_id: initialData.id,
                user_id: user.id
            });
            // Reload actions
            loadSubItems(initialData.id);
            setIsActionModalOpen(false); // Close modal on success
        } catch (e) {
            console.error("Failed to create action", e);
            alert('Failed to create action');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl rounded-lg bg-card p-6 shadow-xl ring-1 ring-border max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-card-foreground">
                        {initialData ? 'Edit Meeting' : 'New Meeting'}
                    </h2>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Meeting Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={datePart}
                                        onChange={(e) => setDatePart(e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground">Start</label>
                                    <input
                                        type="time"
                                        required
                                        value={timePart}
                                        onChange={(e) => {
                                            setTimePart(e.target.value);
                                            // Optional: Auto-update end time if needed, keeping simple for now
                                        }}
                                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground">End</label>
                                    <input
                                        type="time"
                                        required
                                        value={endTimePart}
                                        onChange={(e) => setEndTimePart(e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            {/* Recurrence Options - Only for new meetings */}
                            {!initialData && (
                                <div className="space-y-2 border-t border-border pt-4">
                                    <h3 className="text-sm font-medium text-foreground">Recurrence</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-muted-foreground">Every</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.recurrence_interval || ''}
                                                onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || null })}
                                                placeholder="1"
                                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-muted-foreground">Unit</label>
                                            <select
                                                value={formData.recurrence_unit || ''}
                                                onChange={(e) => setFormData({ ...formData, recurrence_unit: e.target.value || null })}
                                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="">None</option>
                                                <option value="day">Day(s)</option>
                                                <option value="week">Week(s)</option>
                                                <option value="month">Month(s)</option>
                                                <option value="year">Year(s)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-muted-foreground">End Date</label>
                                            <input
                                                type="date"
                                                required={!!formData.recurrence_interval} // Required if recurrence is active
                                                value={formData.recurrence_end_date ? new Date(formData.recurrence_end_date).toLocaleDateString('en-CA') : ''} // YYYY-MM-DD format safe
                                                onChange={(e) => {
                                                    if (!e.target.value) {
                                                        setFormData({ ...formData, recurrence_end_date: null });
                                                        return;
                                                    }
                                                    // Set to end of day local time to ensure inclusivity
                                                    const date = new Date(e.target.value + 'T23:59:59');
                                                    setFormData({ ...formData, recurrence_end_date: date.toISOString() });
                                                }}
                                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Recurring meetings will be created immediately for the entire period.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-foreground">Location</label>
                                <input
                                    type="text"
                                    value={formData.location || ''}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground">Participants</label>
                                <input
                                    type="text"
                                    value={formData.participants || ''}
                                    onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="e.g. John Doe, Jane Smith - or email addresses"
                                />
                            </div>

                            <div>
                                <TagSelector
                                    selectedTagIds={formData.label_ids || []}
                                    onChange={(ids, names) => setFormData({
                                        ...formData,
                                        label_ids: ids,
                                        tags: names
                                    })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground">Notes</label>
                                <textarea
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={10}
                                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Meeting agenda and notes..."
                                />
                            </div>
                        </div>

                        {/* Right Column: Decisions & Actions (Only in Edit Mode) */}
                        <div className="space-y-6 border-l border-border pl-6">
                            {!initialData ? (
                                <div className="flex h-full items-center justify-center text-center text-muted-foreground p-4 bg-muted/20 rounded-lg">
                                    <p>Save the meeting first to add Decisions and Actions.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Decisions */}
                                    <div>
                                        <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> Decisions
                                        </h3>
                                        <div className="space-y-2 mb-2">
                                            {decisionsList.map(item => (
                                                <div key={item.id} className="group flex items-start justify-between bg-muted/40 p-2 rounded text-sm">
                                                    <span>{item.description}</span>
                                                    <button type="button" onClick={() => handleDeleteDecision(item.id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="New decision..."
                                                className="flex-1 rounded-md border border-input px-2 py-1 text-sm bg-background"
                                                value={newDecisionText}
                                                onChange={e => setNewDecisionText(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddDecision();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddDecision}
                                                className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 hover:bg-secondary/80"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <hr className="border-border" />

                                    {/* Actions */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-md font-semibold flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" /> Actions
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setIsActionModalOpen(true)}
                                                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md flex items-center gap-1 hover:bg-primary/90"
                                            >
                                                <Plus className="h-3 w-3" /> Add
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {actionsList.length === 0 && <p className="text-xs text-muted-foreground italic">No linked actions</p>}
                                            {actionsList.map(item => (
                                                <div key={item.id} className="flex items-center justify-between bg-muted/40 p-2 rounded text-sm border-l-2" style={{ borderLeftColor: item.status === 'Done' ? 'green' : 'orange' }}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.title}</span>
                                                        <span className="text-xs text-muted-foreground">{item.status} - {item.priority}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between border-t border-border pt-4">
                        <div>
                            {initialData && onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(initialData.id)}
                                    className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Meeting
                                </button>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : initialData ? 'Update Meeting' : 'Create Meeting'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <ActionForm
                isOpen={isActionModalOpen}
                onCancel={() => setIsActionModalOpen(false)}
                onSubmit={handleCreateAction}
            />
        </div>
    );
}
