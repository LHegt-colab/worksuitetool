import { useState, useEffect } from 'react';
import type { KnowledgePage, NewKnowledgePage } from './api';
import { X, Plus, Globe } from 'lucide-react';
import { TagSelector } from '../tags/TagSelector';
import { useAuth } from '../../contexts/AuthContext';
import { EntitySelector } from '../../components/ui/EntitySelector';
import { actionsApi, type Action } from '../actions/api';

interface KnowledgeFormProps {
    initialData?: KnowledgePage;
    onSubmit: (data: NewKnowledgePage) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
    onDelete?: () => void;
}

export function KnowledgeForm({ initialData, onSubmit, onCancel, isOpen, onDelete }: KnowledgeFormProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<NewKnowledgePage>({
        title: '',
        content: '',
        tags: [],
        urls: [],
        label_ids: [],
        action_ids: [],
        is_pinned: false,
    });
    const [loading, setLoading] = useState(false);
    const [actions, setActions] = useState<Action[]>([]);
    const [urlInput, setUrlInput] = useState('');

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
                title: initialData.title,
                content: initialData.content,
                tags: initialData.tags || [],
                urls: initialData.urls || [],
                label_ids: initialData.label_ids || [],
                action_ids: initialData.action_ids || [],
                is_pinned: initialData.is_pinned || false,
            });
        } else {
            setFormData({
                title: '',
                content: '',
                tags: [],
                urls: [],
                label_ids: [],
                action_ids: [],
                is_pinned: false,
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
        } catch (error) {
            console.error('Error submitting knowledge page:', error);
            alert('Failed to save knowledge page');
        } finally {
            setLoading(false);
        }
    };

    const addUrl = () => {
        if (urlInput.trim()) {
            setFormData(prev => ({ ...prev, urls: [...(prev.urls || []), urlInput.trim()] }));
            setUrlInput('');
        }
    };

    const removeUrl = (index: number) => {
        setFormData(prev => ({
            ...prev,
            urls: (prev.urls || []).filter((_, i) => i !== index)
        }));
    };

    if (!isOpen) return null;

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
                        {initialData ? 'Edit Page' : 'New Page'}
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
                    <div>
                        <label className="block text-sm font-medium text-foreground">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Page Title"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_pinned"
                            checked={formData.is_pinned || false}
                            onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                            className="rounded border-input text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_pinned" className="text-sm font-medium text-foreground">Pin this page</label>
                    </div>

                    <div>
                        <TagSelector
                            selectedTagIds={formData.label_ids || []}
                            onChange={(ids) => setFormData({ ...formData, label_ids: ids })}
                        />
                    </div>

                    <div>
                        <EntitySelector
                            label="Linked Actions"
                            options={actionOptions}
                            selectedIds={formData.action_ids || []}
                            onChange={(ids) => setFormData({ ...formData, action_ids: ids })}
                            placeholder="Select actions..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground">Reference URLs</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="https://example.com"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addUrl();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={addUrl}
                                className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {formData.urls?.map((url, index) => (
                                <div key={index} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1 text-sm">
                                    <div className="flex items-center gap-2 truncate">
                                        <Globe className="h-3 w-3 text-muted-foreground" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-500 hover:underline">
                                            {url}
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeUrl(index)}
                                        className="ml-2 text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground">Content</label>
                        <textarea
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={15}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Markdown content..."
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
                            {loading ? 'Saving...' : initialData ? 'Update Page' : 'Create Page'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
