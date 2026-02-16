import { useEffect, useState } from 'react';
import { settingsApi } from '../../lib/api/settings';
import type { Tag } from '../../types';
import { Tag as TagIcon, X, Plus } from 'lucide-react';

interface TagSelectorProps {
    selectedTags: string[]; // Array of tag DATE (names)
    onChange: (tags: string[]) => void;
}

export default function TagSelector({ selectedTags = [], onChange }: TagSelectorProps) {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTags();
    }, []);

    async function loadTags() {
        try {
            const data = await settingsApi.fetchTags();
            setAvailableTags(data);
        } catch (e) {
            console.error('Failed to load tags', e);
        } finally {
            setLoading(false);
        }
    }

    const handleToggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            onChange(selectedTags.filter(t => t !== tagName));
        } else {
            onChange([...selectedTags, tagName]);
        }
    };

    if (loading) return <div className="text-xs text-text-muted">Loading tags...</div>;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {selectedTags.map(tagName => {
                    const tagDef = availableTags.find(t => t.name === tagName);
                    const color = tagDef?.color || '#9ca3af';

                    return (
                        <span
                            key={tagName}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm transition-all"
                            style={{
                                backgroundColor: `${color}15`,
                                color: color,
                                borderColor: `${color}30`
                            }}
                        >
                            {tagName}
                            <button
                                type="button"
                                onClick={() => handleToggleTag(tagName)}
                                className="hover:opacity-100 opacity-60 ml-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    );
                })}
            </div>

            <div className="relative">
                <select
                    className="w-full pl-8 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-primary text-text appearance-none cursor-pointer"
                    onChange={(e) => {
                        if (e.target.value) handleToggleTag(e.target.value);
                        e.target.value = '';
                    }}
                >
                    <option value="">+ Add Label...</option>
                    {availableTags
                        .filter(t => !selectedTags.includes(t.name))
                        .map(tag => (
                            <option key={tag.id} value={tag.name}>
                                {tag.name}
                            </option>
                        ))
                    }
                </select>
                <TagIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
            </div>

            {availableTags.length === 0 && (
                <p className="text-xs text-text-muted">
                    No tags defined. Go to Settings to create tags.
                </p>
            )}
        </div>
    );
}
