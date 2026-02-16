import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Pin } from 'lucide-react';
import { knowledgeApi } from '../lib/api/knowledge';
import type { KnowledgePage } from '../types';

export default function Knowledge() {
    const [pages, setPages] = useState<KnowledgePage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadPages();
    }, []);

    async function loadPages() {
        try {
            setLoading(true);
            const data = await knowledgeApi.fetchPages();
            setPages(data);
        } catch (err) {
            setError('Failed to load knowledge pages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredPages = pages.filter(page =>
        page.title.toLowerCase().includes(search.toLowerCase()) ||
        page.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) return <div className="p-4">Loading knowledge base...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-primary">Knowledge</h1>
                <Link
                    to="/knowledge/new"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Page
                </Link>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search titles or tags..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPages.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-text-muted">
                        No pages found. Create one to document your knowledge.
                    </div>
                ) : (
                    filteredPages.map((page) => (
                        <Link
                            key={page.id}
                            to={`/knowledge/${page.id}`}
                            className="block group"
                        >
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border group-hover:border-primary transition-all h-full flex flex-col relative overflow-hidden">
                                {page.is_pinned && (
                                    <div className="absolute top-0 right-0 p-2 text-accent">
                                        <Pin className="h-4 w-4 fill-current transform rotate-45" />
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-1">
                                        {page.title}
                                    </h3>
                                </div>

                                <p className="text-text-muted line-clamp-3 mb-4 text-sm flex-1">
                                    {page.content || 'No content preview available.'}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {page.grid_area && (
                                        <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                                            {page.grid_area}
                                        </span>
                                    )}
                                    {page.tags?.map((tag, i) => (
                                        <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
