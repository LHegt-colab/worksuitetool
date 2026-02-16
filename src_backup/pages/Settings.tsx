import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { settingsApi } from '../lib/api/settings';
import type { Tag, Grid } from '../types';
import { Moon, Sun, Trash2, Plus, Tag as TagIcon, LayoutGrid, User } from 'lucide-react';

export default function Settings() {
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [tags, setTags] = useState<Tag[]>([]);
    const [grids, setGrids] = useState<Grid[]>([]);
    const [newTag, setNewTag] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6');
    const [newGrid, setNewGrid] = useState('');
    const [loading, setLoading] = useState(true);

    const PRESET_COLORS = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4',
        '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
    ];

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            setLoading(true);
            const [tagsData, gridsData] = await Promise.all([
                settingsApi.fetchTags(),
                settingsApi.fetchGrids()
            ]);
            setTags(tagsData);
            setGrids(gridsData);
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddTag(e: React.FormEvent) {
        e.preventDefault();
        if (!newTag.trim()) return;
        try {
            const tag = await settingsApi.createTag(newTag.trim(), newTagColor);
            setTags([...tags, tag]);
            setNewTag('');
            setNewTagColor('#3b82f6');
        } catch (error) {
            console.error('Failed to add tag', error);
        }
    }

    async function handleDeleteTag(id: string) {
        try {
            await settingsApi.deleteTag(id);
            setTags(tags.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete tag', error);
        }
    }

    async function handleAddGrid(e: React.FormEvent) {
        e.preventDefault();
        if (!newGrid.trim()) return;
        try {
            const grid = await settingsApi.createGrid(newGrid.trim());
            setGrids([...grids, grid]);
            setNewGrid('');
        } catch (error) {
            console.error('Failed to add grid', error);
        }
    }

    async function handleDeleteGrid(id: string) {
        try {
            await settingsApi.deleteGrid(id);
            setGrids(grids.filter(g => g.id !== id));
        } catch (error) {
            console.error('Failed to delete grid', error);
        }
    }

    if (loading) return <div className="p-4">Loading settings...</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-primary">Settings</h1>

            {/* Profile & Theme */}
            <div className="bg-card shadow-sm border border-border rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <User className="h-5 w-5" />
                    Account & Preferences
                </h2>

                <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                        <p className="font-medium text-text">Email</p>
                        <p className="text-sm text-text-muted">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="flex items-center justify-between py-4">
                    <div>
                        <p className="font-medium text-text">Appearance</p>
                        <p className="text-sm text-text-muted">Switch between light and dark mode</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Manager: Tags */}
            <div className="bg-card shadow-sm border border-border rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <TagIcon className="h-5 w-5" />
                    Manage Tags
                </h2>



                // ... (keep handleDeleteTag) ...

                // ... (inside the form)
                <form onSubmit={handleAddTag} className="flex gap-2 items-center">
                    <div className="flex gap-1 p-1 bg-muted rounded-md">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setNewTagColor(color)}
                                className={`w-6 h-6 rounded-full transition-transform ${newTagColor === color ? 'scale-110 ring-2 ring-offset-1 ring-primary' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <input
                        type="text"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        placeholder="New tag name..."
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                        type="submit"
                        disabled={!newTag.trim()}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </form>

                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <div
                            key={tag.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white shadow-sm"
                            style={{ backgroundColor: tag.color || '#64748b' }}
                        >
                            <span>{tag.name}</span>
                            <button
                                onClick={() => handleDeleteTag(tag.id)}
                                className="text-text-muted hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {tags.length === 0 && <span className="text-text-muted text-sm italic">No tags created yet.</span>}
                </div>
            </div>

            {/* Manager: Grids */}
            <div className="bg-card shadow-sm border border-border rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <LayoutGrid className="h-5 w-5" />
                    Manage Grids (Areas)
                </h2>

                <form onSubmit={handleAddGrid} className="flex gap-2">
                    <input
                        type="text"
                        value={newGrid}
                        onChange={e => setNewGrid(e.target.value)}
                        placeholder="New grid area (e.g. Marketing)..."
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                        type="submit"
                        disabled={!newGrid.trim()}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </form>

                <div className="flex flex-wrap gap-2">
                    {grids.map(grid => (
                        <div key={grid.id} className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium">
                            <span>{grid.name}</span>
                            <button
                                onClick={() => handleDeleteGrid(grid.id)}
                                className="text-accent/60 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {grids.length === 0 && <span className="text-text-muted text-sm italic">No grid areas created yet.</span>}
                </div>
            </div>
        </div>
    );
}
