import { useState, useEffect } from 'react';
import type { TimeEntry, NewTimeEntry } from './api';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EntitySelector } from '../../components/ui/EntitySelector';
import { actionsApi, type Action } from '../actions/api';
import { differenceInMinutes, parse, format } from 'date-fns';

interface TimeFormProps {
    initialData?: TimeEntry;
    onSubmit: (data: NewTimeEntry) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
}

type EntryType = 'work' | 'vacation' | 'sick' | 'balance';

export function TimeForm({ initialData, onSubmit, onCancel, isOpen }: TimeFormProps) {
    const { user } = useAuth();
    const [mode, setMode] = useState<'hours' | 'manual'>('hours');

    // Form State
    const [formData, setFormData] = useState<Partial<NewTimeEntry>>({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'work',
        duration: 0,
        description: '',
        action_id: null,
        start_time: '09:00',
        end_time: '17:00',
        break_duration: 30
    });

    const [loading, setLoading] = useState(false);
    const [actions, setActions] = useState<Action[]>([]);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const a = await actionsApi.getActions();
                setActions(a || []);
            } catch (e) {
                console.error("Failed to load options", e);
            }
        };
        if (isOpen) loadOptions();
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date,
                duration: initialData.duration,
                description: initialData.description,
                action_id: initialData.action_id,
                start_time: initialData.start_time,
                end_time: initialData.end_time,
                break_duration: initialData.break_duration,
                type: initialData.type || 'work'
            });
            // Detect mode based on data
            if (initialData.start_time && initialData.end_time) {
                setMode('hours');
            } else {
                setMode('manual');
            }
        } else {
            // Reset to defaults
            setFormData({
                date: format(new Date(), 'yyyy-MM-dd'),
                type: 'work',
                duration: 450, // 7.5h default
                description: '',
                action_id: null,
                start_time: '09:00',
                end_time: '17:00',
                break_duration: 30
            });
            setMode('hours');
        }
    }, [initialData, isOpen]);

    // Auto-calculate duration when times change in 'hours' mode
    useEffect(() => {
        if (mode === 'hours' && formData.start_time && formData.end_time) {
            try {
                const date = new Date(); // Dummy date
                const start = parse(formData.start_time, 'HH:mm', date);
                const end = parse(formData.end_time, 'HH:mm', date);

                let diff = differenceInMinutes(end, start);
                if (diff < 0) diff += 24 * 60; // Handle overnight? Maybe not for now without date.

                const duration = diff - (formData.break_duration || 0);
                setFormData(prev => ({ ...prev, duration: duration > 0 ? duration : 0 }));
            } catch (e) {
                // Invalid time
            }
        }
    }, [formData.start_time, formData.end_time, formData.break_duration, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!user) return;

            // Clean up data based on mode
            const submissionData: NewTimeEntry = {
                user_id: user.id,
                date: formData.date!,
                type: formData.type!,
                description: formData.description,
                action_id: formData.action_id,
                duration: formData.duration || 0,
                // Only send time fields if in hours mode
                start_time: mode === 'hours' ? formData.start_time : null,
                end_time: mode === 'hours' ? formData.end_time : null,
                break_duration: mode === 'hours' ? formData.break_duration || 0 : 0
            };

            await onSubmit(submissionData);
            onCancel();
        } catch (error) {
            console.error('Error submitting time entry:', error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            alert(`Failed to save time entry: ${(error as any).message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const actionOptions = actions.map(a => ({
        id: a.id,
        label: a.title,
        subLabel: `${a.status} - ${a.priority}`
    }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl ring-1 ring-border max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-card-foreground">
                        {initialData ? 'Edit Entry' : 'Log Time / Vacation'}
                    </h2>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Entry Type Selector */}
                <div className="flex gap-2 mb-6">
                    {(['work', 'vacation', 'sick', 'balance'] as EntryType[]).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: t })}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors
                                ${formData.type === t
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'}
                            `}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* Mode Toggle for Work */}
                    {formData.type === 'work' && (
                        <div className="flex bg-muted p-1 rounded-md mb-2">
                            <button
                                type="button"
                                onClick={() => setMode('hours')}
                                className={`flex-1 text-xs py-1 rounded-sm font-medium transition-all ${mode === 'hours' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                            >
                                Hours (Start - End)
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('manual')}
                                className={`flex-1 text-xs py-1 rounded-sm font-medium transition-all ${mode === 'manual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                            >
                                Duration Only
                            </button>
                        </div>
                    )}

                    {/* Time Input Fields using native time inputs */}
                    {formData.type === 'work' && mode === 'hours' && (
                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-md border border-border">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Start</label>
                                <input
                                    type="time"
                                    value={formData.start_time || ''}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">End</label>
                                <input
                                    type="time"
                                    value={formData.end_time || ''}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Break (min)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="15"
                                    value={formData.break_duration}
                                    onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) || 0 })}
                                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Duration Display / Input */}
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Duration
                            {mode === 'hours' && formData.type === 'work' && <span className="text-muted-foreground font-normal ml-2">(Calculated: {((formData.duration || 0) / 60).toFixed(2)}h)</span>}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="number"
                                required
                                readOnly={mode === 'hours' && formData.type === 'work'}
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                className={`block w-full rounded-md border border-input px-3 py-2 text-sm 
                                    ${mode === 'hours' && formData.type === 'work' ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-background text-foreground'}`}
                            />
                            <span className="text-sm font-medium">min</span>
                        </div>
                        {formData.type === 'balance' && (
                            <p className="text-xs text-muted-foreground mt-1">Use negative values to deduct from balance, positive to add.</p>
                        )}
                    </div>

                    {/* Action Link */}
                    {['work'].includes(formData.type!) && (
                        <div>
                            <EntitySelector
                                label="Linked Action (Optional)"
                                options={actionOptions}
                                selectedIds={formData.action_id ? [formData.action_id] : []}
                                onChange={(ids) => setFormData({ ...formData, action_id: ids[0] || null })}
                                placeholder="Select action..."
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground">Description</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder={formData.type === 'vacation' ? "Holiday reason..." : "What did you work on?"}
                        />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-border">
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
                            {loading ? 'Saving...' : initialData ? 'Update Entry' : 'Log Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
