import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { actionsApi } from '../lib/api/actions';
import type { CreateActionDTO, ActionStatus, ActionPriority } from '../types';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import TagSelector from '../components/common/TagSelector';

export default function ActionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateActionDTO>({
        title: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        start_date: '',
        due_date: '',
        grid_area: '',
        tags: [],
        is_focus: false
    });

    useEffect(() => {
        if (!isNew && id) {
            loadAction(id);
        }
    }, [id, isNew]);

    async function loadAction(actionId: string) {
        try {
            setLoading(true);
            const action = await actionsApi.getActionById(actionId);
            setFormData({
                title: action.title,
                description: action.description,
                status: action.status,
                priority: action.priority,
                start_date: action.start_date ? new Date(action.start_date).toISOString().slice(0, 16) : '',
                due_date: action.due_date ? new Date(action.due_date).toISOString().slice(0, 16) : '',
                grid_area: action.grid_area,
                tags: action.tags || [],
                is_focus: action.is_focus
            });
        } catch (err) {
            setError('Failed to load action');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSaving(true);
            const actionData = {
                ...formData,
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
                due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined
            };

            if (isNew) {
                await actionsApi.createAction(actionData as CreateActionDTO);
            } else if (id) {
                await actionsApi.updateAction(id, actionData);
            }
            navigate('/actions');
        } catch (err) {
            setError('Failed to save action');
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!id || !window.confirm('Are you sure you want to delete this action?')) return;

        try {
            setSaving(true);
            await actionsApi.deleteAction(id);
            navigate('/actions');
        } catch (err) {
            setError('Failed to delete action');
            setSaving(false);
        }
    }

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/actions')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-text-muted" />
                    </button>
                    <h1 className="text-3xl font-bold text-primary">
                        {isNew ? 'New Action' : 'Edit Action'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {!isNew && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Action"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            <div className="bg-card shadow-sm border border-border rounded-xl p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Action title"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Status</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as ActionStatus })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="Open">Open</option>
                            <option value="Doing">Doing</option>
                            <option value="Waiting">Waiting</option>
                            <option value="Done">Done</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Priority</label>
                        <select
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value as ActionPriority })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Start Date</label>
                        <input
                            type="datetime-local"
                            value={formData.start_date || ''}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Due Date</label>
                        <input
                            type="datetime-local"
                            value={formData.due_date || ''}
                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Grid Area</label>
                        <input
                            type="text"
                            value={formData.grid_area || ''}
                            onChange={e => setFormData({ ...formData, grid_area: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Project X"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Tags</label>
                        <TagSelector
                            selectedTags={formData.tags || []}
                            onChange={tags => setFormData({ ...formData, tags })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Description</label>
                    <textarea
                        rows={6}
                        value={formData.description || ''}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Action description..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="is_focus"
                        checked={formData.is_focus || false}
                        onChange={e => setFormData({ ...formData, is_focus: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="is_focus" className="text-sm font-medium text-text">
                        Mark as Focus Item (Top Priority)
                    </label>
                </div>
            </div>
        </form>
    );
}
