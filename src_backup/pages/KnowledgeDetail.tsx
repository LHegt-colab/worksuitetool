import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgeApi } from '../lib/api/knowledge';
import type { CreateKnowledgePageDTO } from '../types';
import { ArrowLeft, Save, Trash2, Pin } from 'lucide-react';
import TagSelector from '../components/common/TagSelector';

export default function KnowledgeDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateKnowledgePageDTO>({
        title: '',
        content: '',
        grid_area: '',
        tags: [],
        is_pinned: false
    });

    useEffect(() => {
        if (!isNew && id) {
            loadPage(id);
        }
    }, [id, isNew]);

    async function loadPage(pageId: string) {
        try {
            setLoading(true);
            const page = await knowledgeApi.getPageById(pageId);
            setFormData({
                title: page.title,
                content: page.content || '',
                grid_area: page.grid_area,
                tags: page.tags || [],
                is_pinned: page.is_pinned
            });
        } catch (err) {
            setError('Failed to load page');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSaving(true);

            if (isNew) {
                await knowledgeApi.createPage(formData as CreateKnowledgePageDTO);
            } else if (id) {
                await knowledgeApi.updatePage(id, formData);
            }
            navigate('/knowledge');
        } catch (err) {
            setError('Failed to save page');
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!id || !window.confirm('Are you sure you want to delete this page?')) return;

        try {
            setSaving(true);
            await knowledgeApi.deletePage(id);
            navigate('/knowledge');
        } catch (err) {
            setError('Failed to delete page');
            setSaving(false);
        }
    }

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/knowledge')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-text-muted" />
                    </button>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="text-3xl font-bold text-primary bg-transparent border-none focus:ring-0 placeholder:text-primary/50"
                        placeholder="Page Title"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, is_pinned: !prev.is_pinned }))}
                        className={`p-2 rounded-md transition-colors ${formData.is_pinned ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-gray-100'}`}
                        title={formData.is_pinned ? "Unpin" : "Pin"}
                    >
                        <Pin className={`h-5 w-5 ${formData.is_pinned ? 'fill-current' : ''}`} />
                    </button>
                    {!isNew && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Page"
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
                <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-200 shrink-0">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="md:col-span-2 bg-card shadow-sm border border-border rounded-xl p-0 flex flex-col overflow-hidden">
                    <textarea
                        value={formData.content || ''}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        className="w-full h-full p-6 bg-background text-text focus:outline-none resize-none font-mono text-sm leading-relaxed"
                        placeholder="# Start writing your documentation here..."
                    />
                </div>

                <div className="space-y-6 overflow-y-auto">
                    <div className="bg-card shadow-sm border border-border rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-primary">Properties</h3>

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

                    <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                        <h4 className="font-semibold text-primary mb-2">Tips</h4>
                        <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
                            <li>Use this for long-form content.</li>
                            <li>Documentation, standard procedures (SOPs), or project specs.</li>
                            <li>Pin important pages for quick access.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </form>
    );
}
