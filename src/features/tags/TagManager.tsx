import { useState, useEffect } from 'react';
import { tagsApi, type Tag } from './api';
import { Plus, X, Tag as TagIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TagManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TagManager({ isOpen, onClose }: TagManagerProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6'); // Default blue
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const loadTags = async () => {
        try {
            const data = await tagsApi.getTags();
            setTags(data);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadTags();
        }
    }, [isOpen]);

    const handleCreate = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!user || !newTagName.trim()) return;

        setLoading(true);
        try {
            await tagsApi.createTag({
                name: newTagName.trim(),
                color: newTagColor,
                user_id: user.id
            });
            setNewTagName('');
            loadTags();
        } catch (error) {
            console.error('Failed to create tag', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this label?")) return;
        try {
            await tagsApi.deleteTag(id);
            loadTags();
        } catch (error) {
            console.error("Failed to delete tag", error);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl ring-1 ring-border">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                        <TagIcon className="h-5 w-5" />
                        Manage Labels
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6 flex gap-2">
                    <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="h-9 w-9 cursor-pointer rounded border border-input p-0"
                        title="Choose color"
                    />
                    <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate(e)}
                        placeholder="New Label Name"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading}
                        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {tags.map(tag => (
                        <div key={tag.id} className="flex items-center justify-between rounded-md border border-border p-2">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color || '#ccc' }} />
                                <span className="text-sm font-medium text-foreground">{tag.name}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(tag.id)}
                                className="text-muted-foreground hover:text-destructive"
                                title="Delete Label"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {tags.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground">No labels yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
