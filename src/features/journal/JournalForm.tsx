import { useState, useEffect } from 'react';
import type { JournalEntry, NewJournalEntry } from './api';
import { X } from 'lucide-react';
import { TagSelector } from '../tags/TagSelector';
import { useAuth } from '../../contexts/AuthContext';
import { EntitySelector } from '../../components/ui/EntitySelector';
import { meetingsApi, type Meeting } from '../meetings/api';
import { actionsApi, type Action } from '../actions/api';

interface JournalFormProps {
    initialData?: JournalEntry;
    onSubmit: (data: NewJournalEntry) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
    onDelete?: () => void;
}

export function JournalForm({ initialData, onSubmit, onCancel, isOpen, onDelete }: JournalFormProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<NewJournalEntry>({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        label_ids: [],
        meeting_ids: [],
        action_ids: [],
        knowledge_page_ids: [],
    });
    const [loading, setLoading] = useState(false);

    // Filter Options
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [actions, setActions] = useState<Action[]>([]);

    useEffect(() => {
        // Load meetings and actions for selectors
        const loadOptions = async () => {
            try {
                const [m, a] = await Promise.all([
                    meetingsApi.getMeetings(),
                    actionsApi.getActions()
                ]);
                setMeetings(m || []);
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
                title: initialData.title,
                content: initialData.content,
                date: initialData.date,
                tags: initialData.tags || [],
                label_ids: initialData.label_ids || [],
                meeting_ids: initialData.meeting_ids || [],
                action_ids: initialData.action_ids || [],
                knowledge_page_ids: initialData.knowledge_page_ids || [],
            });
        } else {
            setFormData({
                title: '',
                content: '',
                date: new Date().toISOString().split('T')[0],
                tags: [],
                label_ids: [],
                meeting_ids: [],
                action_ids: [],
                knowledge_page_ids: [],
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!user) return;
            await onSubmit({ ...formData, user_id: user.id });
            onCancel();
        } catch (error: any) {
            console.error('Error submitting journal entry:', error);
            alert(`Failed to save journal entry: ${error.message || error.details || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const meetingOptions = meetings.map(m => ({
        id: m.id,
        label: m.title,
        subLabel: new Date(m.date_time).toLocaleDateString()
    }));

    const actionOptions = actions.map(a => ({
        id: a.id,
        label: a.title,
        subLabel: `${a.status} - ${a.priority}`
    }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-card p-6 shadow-xl ring-1 ring-border max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-card-foreground">
                        {initialData ? 'Edit Entry' : 'New Entry'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {onDelete && initialData && (
                            <button onClick={onDelete} type="button" className="text-sm font-medium text-destructive hover:underline px-2">
                                Delete
                            </button>
                        )}
                        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
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
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground">Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Day Summary / Topic"
                            />
                        </div>
                    </div>

                    <div>
                        <TagSelector
                            selectedTagIds={formData.label_ids || []}
                            onChange={(ids) => setFormData({ ...formData, label_ids: ids })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-border py-4">
                        <EntitySelector
                            label="Linked Meetings"
                            options={meetingOptions}
                            selectedIds={formData.meeting_ids || []}
                            onChange={(ids) => setFormData({ ...formData, meeting_ids: ids })}
                            placeholder="Select meetings..."
                        />
                        <EntitySelector
                            label="Linked Actions"
                            options={actionOptions}
                            selectedIds={formData.action_ids || []}
                            onChange={(ids) => setFormData({ ...formData, action_ids: ids })}
                            placeholder="Select actions..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground">Content</label>
                        <textarea
                            required
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={12}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Write your thoughts here..."
                        />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
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
                            {loading ? 'Saving...' : initialData ? 'Update Entry' : 'Create Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
