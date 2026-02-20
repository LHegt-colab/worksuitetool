import { useState, useEffect } from 'react';
import { Plus, Search, Book, Pin, Filter } from 'lucide-react';
import { knowledgeApi, type KnowledgePage, type NewKnowledgePage } from './api';
import { tagsApi, type Tag } from '../tags/api';
import { KnowledgeForm } from './KnowledgeForm';
import { format, parseISO } from 'date-fns';

export function KnowledgeList() {
    const [pages, setPages] = useState<KnowledgePage[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<KnowledgePage | undefined>(undefined);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLabelId, setSelectedLabelId] = useState<string>('all');

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, tagsData] = await Promise.all([
                knowledgeApi.getPages(),
                tagsApi.getTags()
            ]);
            setPages(data || []);
            setTags(tagsData || []);
        } catch (error) {
            console.error('Failed to load knowledge pages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (data: NewKnowledgePage) => {
        try {
            await knowledgeApi.createPage(data);
            setIsFormOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to create page:', error);
        }
    };

    const handleUpdate = async (id: string, data: any) => {
        try {
            await knowledgeApi.updatePage(id, data);
            setIsFormOpen(false);
            setEditingPage(undefined);
            loadData();
        } catch (error) {
            console.error('Failed to update page:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            await knowledgeApi.deletePage(id);
            setIsFormOpen(false);
            setEditingPage(undefined);
            loadData();
        } catch (error) {
            console.error('Failed to delete page:', error);
        }
    };

    const getTagName = (id: string) => tags.find(t => t.id === id)?.name;
    const getTagColor = (id: string) => tags.find(t => t.id === id)?.color;

    // Filter Logic
    const filteredPages = pages.filter(page => {
        const matchesSearch =
            page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (page.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        // Label Filter
        let matchesLabel = true;
        if (selectedLabelId !== 'all') {
            matchesLabel = page.label_ids?.includes(selectedLabelId) || false;
        }

        return matchesSearch && matchesLabel;
    });

    // Sort: Pinned first, then updated_at desc
    const sortedPages = [...filteredPages].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading knowledge base...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
                <button
                    onClick={() => {
                        setEditingPage(undefined);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Page
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border">
                <div className="flex flex-1 w-full md:w-auto items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search knowledge..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Filter */}
                    <div className="relative min-w-[140px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                            <Filter className="h-4 w-4" />
                        </div>
                        <select
                            value={selectedLabelId}
                            onChange={(e) => setSelectedLabelId(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Labels</option>
                            {tags.map(tag => (
                                <option key={tag.id} value={tag.id}>{tag.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedPages.length > 0 ? (
                    sortedPages.map((page) => (
                        <div
                            key={page.id}
                            onClick={() => { setEditingPage(page); setIsFormOpen(true); }}
                            className={`
                                group relative flex flex-col gap-3 rounded-lg border bg-card p-5 cursor-pointer transition-all
                                hover:border-primary/50 hover:shadow-md
                                ${page.is_pinned ? 'border-primary/40 bg-primary/5' : 'border-border'}
                            `}
                        >
                            {page.is_pinned && (
                                <div className="absolute top-3 right-3 text-primary">
                                    <Pin className="h-4 w-4 rotate-45" fill="currentColor" />
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <Book className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors pr-6">
                                    {page.title}
                                </h3>
                            </div>

                            {page.content && (
                                <p className="text-sm text-muted-foreground line-clamp-3 pl-8">
                                    {page.content}
                                </p>
                            )}

                            <div className="mt-auto pt-3 pl-8 flex items-center justify-between">
                                {/* Labels */}
                                <div className="flex flex-wrap gap-2">
                                    {page.label_ids?.slice(0, 3).map(id => {
                                        const color = getTagColor(id);
                                        return (
                                            <span
                                                key={id}
                                                className="px-2 py-0.5 text-xs rounded-full font-medium border"
                                                style={{
                                                    backgroundColor: color ? `${color}15` : 'transparent',
                                                    borderColor: color ? `${color}30` : 'currentColor',
                                                    color: color || 'inherit'
                                                }}
                                            >
                                                {getTagName(id)}
                                            </span>
                                        );
                                    })}
                                    {(page.label_ids?.length || 0) > 3 && (
                                        <span className="text-xs text-muted-foreground">+{page.label_ids!.length - 3}</span>
                                    )}
                                </div>

                                <span className="text-xs text-muted-foreground">
                                    {format(parseISO(page.updated_at), 'MMM d')}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border">
                        {searchQuery || selectedLabelId !== 'all'
                            ? 'No pages found matching your filters.'
                            : 'Knowledge base is empty. Create your first page!'}
                    </div>
                )}
            </div>

            <KnowledgeForm
                isOpen={isFormOpen}
                initialData={editingPage}
                onCancel={() => {
                    setIsFormOpen(false);
                    setEditingPage(undefined);
                }}
                onSubmit={editingPage ? (data) => handleUpdate(editingPage.id, data) : handleCreate}
                onDelete={editingPage ? () => handleDelete(editingPage.id) : undefined}
            />
        </div>
    );
}
