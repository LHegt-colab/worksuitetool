import { useState, useEffect } from 'react';
import { knowledgeApi, type KnowledgePage, type NewKnowledgePage } from './api';
import { KnowledgeForm } from './KnowledgeForm';
import { Plus, Search, Pin, Globe, CheckSquare } from 'lucide-react';
import { tagsApi, type Tag } from '../tags/api';
import { actionsApi, type Action } from '../actions/api';
import { useAuth } from '../../contexts/AuthContext';

export function KnowledgeList() {
    const [pages, setPages] = useState<KnowledgePage[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<KnowledgePage | undefined>(undefined);
    const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [pagesData, tagsData, actionsData] = await Promise.all([
                knowledgeApi.getPages(),
                tagsApi.getTags(),
                actionsApi.getActions()
            ]);
            setPages(pagesData || []);
            setTags(tagsData || []);
            setActions(actionsData || []);
        } catch (error) {
            console.error('Failed to load knowledge data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (data: NewKnowledgePage) => {
        if (!user) return;
        await knowledgeApi.createPage({ ...data, user_id: user.id });
        loadData();
    };

    const handleUpdate = async (data: NewKnowledgePage) => {
        if (!editingPage) return;
        await knowledgeApi.updatePage(editingPage.id, data);
        loadData();
        setEditingPage(undefined);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this page?')) {
            await knowledgeApi.deletePage(id);
            loadData();
        }
    };

    const openEdit = (page: KnowledgePage) => {
        setEditingPage(page);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingPage(undefined);
    };

    const getTagDetails = (tagId: string) => tags.find(t => t.id === tagId);
    const getActionDetails = (id: string) => actions.find(a => a.id === id);

    const filteredPages = pages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.content && page.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sort to show pinned first
    const sortedPages = [...filteredPages].sort((a, b) => {
        if (a.is_pinned === b.is_pinned) return 0;
        return a.is_pinned ? -1 : 1;
    });

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading knowledge base...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Page
                </button>
            </div>

            <div className="flex items-center bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search knowledge..."
                        className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedPages.map((page) => (
                    <div key={page.id} className={`group relative flex flex-col justify-between rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md ${page.is_pinned ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                {page.is_pinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors mb-2">
                                    {page.title}
                                </h3>
                                {(page.urls && page.urls.length > 0) && (
                                    <div className="flex flex-col gap-1 mb-2">
                                        {page.urls.slice(0, 2).map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate">
                                                <Globe className="h-3 w-3" /> {url}
                                            </a>
                                        ))}
                                        {page.urls.length > 2 && <span className="text-xs text-muted-foreground">+{page.urls.length - 2} more links</span>}
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                                    {page.content}
                                </p>
                            </div>

                            {(page.action_ids && page.action_ids.length > 0) && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {page.action_ids.map(id => {
                                        const a = getActionDetails(id);
                                        if (!a) return null;
                                        return (
                                            <span key={id} className="inline-flex items-center gap-1 text-xs text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">
                                                <CheckSquare className="h-3 w-3" /> {a.title}
                                            </span>
                                        )
                                    })}
                                </div>
                            )}

                            {page.label_ids && page.label_ids.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {page.label_ids.map((labelId: string) => {
                                        const tag = getTagDetails(labelId);
                                        if (!tag) return null;
                                        return (
                                            <span
                                                key={labelId}
                                                className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
                                                style={{ backgroundColor: tag.color || '#999' }}
                                            >
                                                {tag.name}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                onClick={() => openEdit(page)}
                                className="text-xs font-medium text-primary hover:underline"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(page.id)}
                                className="text-xs font-medium text-destructive hover:underline"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <KnowledgeForm
                isOpen={isFormOpen}
                initialData={editingPage}
                onSubmit={editingPage ? handleUpdate : handleCreate}
                onCancel={closeForm}
            />
        </div>
    );
}
