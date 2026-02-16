import { useState, useEffect } from 'react';
import type { Action, NewAction } from './api';
import { X } from 'lucide-react';
import { TagSelector } from '../tags/TagSelector';

interface ActionFormProps {
    initialData?: Action;
    onSubmit: (data: NewAction) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
}

export function ActionForm({ initialData, onSubmit, onCancel, isOpen }: ActionFormProps) {
    const [formData, setFormData] = useState<NewAction>({
        title: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        start_date: new Date().toISOString().split('T')[0], // Default to today
        due_date: '',
        tags: [],
        label_ids: [],
        // We explicitly ignore grid_area as per requirements
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description || '',
                status: initialData.status,
                priority: initialData.priority,
                start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
                due_date: initialData.due_date ? initialData.due_date.split('T')[0] : '',
                tags: initialData.tags || [],
                label_ids: initialData.label_ids || [],
            });
        } else {
            // Reset details when opening fresh
            setFormData({
                title: '',
                description: '',
                status: 'Open',
                priority: 'Medium',
                start_date: new Date().toISOString().split('T')[0],
                due_date: '',
                tags: [],
                label_ids: [],
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ensure dates are ISO formatted if present
            const submissionData = { ...formData };
            if (submissionData.start_date) submissionData.start_date = new Date(submissionData.start_date).toISOString();
            if (submissionData.due_date) submissionData.due_date = new Date(submissionData.due_date).toISOString();

            await onSubmit(submissionData);
            onCancel();
        } catch (error) {
            console.error('Error submitting action:', error);
            alert('Failed to save action');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl ring-1 ring-border">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-card-foreground">
                        {initialData ? 'Edit Action' : 'New Action'}
                    </h2>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground">Description</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Action['status'] })}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="Open">Open</option>
                                <option value="Doing">Doing</option>
                                <option value="Waiting">Waiting</option>
                                <option value="Done">Done</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Action['priority'] })}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground">Start Date</label>
                            <input
                                type="date"
                                value={formData.start_date || ''}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground">Due Date</label>
                            <input
                                type="date"
                                value={formData.due_date || ''}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>



                    <div>
                        <TagSelector
                            selectedTagIds={formData.label_ids || []}
                            onChange={(ids) => setFormData({ ...formData, label_ids: ids })}
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
                            {loading ? 'Saving...' : initialData ? 'Update Action' : 'Create Action'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
