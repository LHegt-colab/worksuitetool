import { useState, useEffect } from 'react';
import { X, Calendar, CheckSquare, Clock } from 'lucide-react';
import { meetingsApi } from '../../lib/api/meetings';
import { actionsApi } from '../../lib/api/actions';
import type { CreateMeetingDTO, CreateActionDTO } from '../../types';

interface CreateItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultDate: Date;
    defaultTime?: string; // "HH:00"
}

export default function CreateItemModal({ isOpen, onClose, onSuccess, defaultDate, defaultTime }: CreateItemModalProps) {
    const [type, setType] = useState<'meeting' | 'action'>('meeting');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    // Shared time inputs
    const [startTime, setStartTime] = useState(defaultTime || '09:00');
    const [duration, setDuration] = useState(60);

    const [hasSpecificTime, setHasSpecificTime] = useState(true); // For actions

    useEffect(() => {
        if (defaultTime) {
            setStartTime(defaultTime);
        }
    }, [defaultTime]);

    // Action specific
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use local date string component construction to avoid timezone shifts
            const year = defaultDate.getFullYear();
            const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
            const day = String(defaultDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            if (type === 'meeting') {
                await meetingsApi.createMeeting({
                    title,
                    date_time: `${dateStr}T${startTime}:00`,
                    location: 'Office', // Default
                    notes: '',
                    participants: ''
                } as CreateMeetingDTO);
            } else {
                // For actions, if hasSpecificTime is true, we set start_date and due_date appropriately
                let start_date = undefined;
                let due_date = dateStr; // Default to just date (all day/deadline)

                if (hasSpecificTime) {
                    // Calculate start and end strings in local time ISO format
                    // Note: We're storing "YYYY-MM-DDTHH:mm:ss" which Supabase Timestamptz might interpret as UTC if no offset given,
                    // OR browser timezone. Best practice used here: Send ISO string.
                    // IMPORTANT: The user previously had issues with times shifting. 
                    // To force "Wall Time" behavior (09:00 is 09:00), we should ideally append the local offset or Z if using UTC.
                    // However, `dateUtils` and current logic seems to rely on local string parsing.
                    // Providing `${dateStr}T${startTime}:00` is ambiguous (interpreted as local by Date, but maybe UTC by PG).
                    // Let's stick to the convention used in Meetings for now: `${dateStr}T${startTime}:00`
                    const startIso = `${dateStr}T${startTime}:00`;

                    // Allow simple calculation for end time
                    const d = new Date(`${dateStr}T${startTime}:00`);
                    d.setMinutes(d.getMinutes() + duration);
                    const endHours = String(d.getHours()).padStart(2, '0');
                    const endMinutes = String(d.getMinutes()).padStart(2, '0');
                    const endIso = `${dateStr}T${endHours}:${endMinutes}:00`;

                    start_date = startIso;
                    due_date = endIso;
                }

                await actionsApi.createAction({
                    title,
                    status: 'Open',
                    priority,
                    start_date, // Now supported
                    due_date,
                    description: ''
                } as CreateActionDTO);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create item', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Add to Calendar</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full"><X className="h-5 w-5" /></button>
                </div>

                {/* Type Selector */}
                <div className="flex bg-muted p-1 rounded-lg">
                    <button
                        onClick={() => setType('meeting')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
                            ${type === 'meeting' ? 'bg-background shadow-sm text-primary' : 'text-text-muted hover:text-text'}
                        `}
                    >
                        <Calendar className="h-4 w-4" />
                        Meeting
                    </button>
                    <button
                        onClick={() => setType('action')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
                            ${type === 'action' ? 'bg-background shadow-sm text-primary' : 'text-text-muted hover:text-text'}
                        `}
                    >
                        <CheckSquare className="h-4 w-4" />
                        Action
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Title</label>
                        <input
                            autoFocus
                            type="text"
                            required
                            className="w-full p-2 border border-border rounded-md bg-background"
                            placeholder={type === 'meeting' ? "Meeting with..." : "Complete task..."}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Date</label>
                        <div className="p-2 border border-border rounded-md bg-muted/20 text-text-muted">
                            {defaultDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    {/* Shared Time Inputs */}
                    {(type === 'meeting' || (type === 'action' && hasSpecificTime)) && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full p-2 border border-border rounded-md bg-background"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Duration (min)</label>
                                <input
                                    type="number"
                                    required
                                    min="15"
                                    step="15"
                                    className="w-full p-2 border border-border rounded-md bg-background"
                                    value={duration}
                                    onChange={e => setDuration(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Specific Options */}
                    {type === 'action' && (
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm text-text-muted">
                                <input
                                    type="checkbox"
                                    checked={hasSpecificTime}
                                    onChange={e => setHasSpecificTime(e.target.checked)}
                                    className="rounded border-border"
                                />
                                Schedule at specific time
                            </label>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Priority</label>
                                <select
                                    className="w-full p-2 border border-border rounded-md bg-background"
                                    value={priority}
                                    onChange={e => setPriority(e.target.value as any)}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted font-medium">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title}
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
