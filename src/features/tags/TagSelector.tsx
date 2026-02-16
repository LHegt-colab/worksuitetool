import { useState, useEffect } from 'react';
import { tagsApi, type Tag } from './api';
import { TagManager } from './TagManager';
import { Plus, Settings2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TagSelectorProps {
    selectedTagIds: string[];
    onChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    useEffect(() => {
        if (!isManagerOpen) {
            const loadTags = async () => {
                const data = await tagsApi.getTags();
                setTags(data);
            };
            loadTags();
        }
    }, [isManagerOpen]);

    const toggleTag = (id: string) => {
        if (selectedTagIds.includes(id)) {
            onChange(selectedTagIds.filter(tagId => tagId !== id));
        } else {
            onChange([...selectedTagIds, id]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">Labels</label>
                <button
                    type="button"
                    onClick={() => setIsManagerOpen(true)}
                    className="text-xs flex items-center gap-1 text-primary hover:underline"
                >
                    <Settings2 className="h-3 w-3" />
                    Manage Labels
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                            selectedTagIds.includes(tag.id)
                                ? "border-transparent text-white"
                                : "border-border bg-transparent text-muted-foreground hover:bg-muted"
                        )}
                        style={{
                            backgroundColor: selectedTagIds.includes(tag.id) ? (tag.color || '#3b82f6') : undefined,
                            borderColor: selectedTagIds.includes(tag.id) ? (tag.color || '#3b82f6') : undefined,
                        }}
                    >
                        {tag.name}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setIsManagerOpen(true)}
                    className="inline-flex items-center rounded-full border border-dashed border-muted-foreground/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <Plus className="mr-1 h-3 w-3" />
                    New
                </button>
            </div>

            <TagManager isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} />
        </div>
    );
}
