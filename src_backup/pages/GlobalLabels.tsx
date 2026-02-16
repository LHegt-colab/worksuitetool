import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tag as TagIcon, Filter, Layers, ExternalLink } from 'lucide-react';
import { actionsApi } from '../lib/api/actions';
import { meetingsApi } from '../lib/api/meetings';
import { knowledgeApi } from '../lib/api/knowledge';
import { journalApi } from '../lib/api/journal'; // Needs a fetchAll or we skip journals for now if no extensive search API
import { settingsApi } from '../lib/api/settings';
import type { Action, Meeting, KnowledgePage, Tag } from '../types';
import { Link } from 'react-router-dom';

// Note: For a real large-scale app, we should filter on the server (Supabase).
// For now, we fetch all and filter client-side as requested for "Global Filter view"
// assuming reasonable dataset size for a personal tool.

export default function GlobalLabels() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTag = searchParams.get('tag') || '';

    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [results, setResults] = useState<{
        actions: Action[];
        meetings: Meeting[];
        knowledge: KnowledgePage[];
    }>({ actions: [], meetings: [], knowledge: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTags();
    }, []);

    useEffect(() => {
        if (activeTag) {
            loadFilteredData(activeTag);
        } else {
            setResults({ actions: [], meetings: [], knowledge: [] });
            setLoading(false);
        }
    }, [activeTag]);

    async function loadTags() {
        const tags = await settingsApi.fetchTags();
        setAllTags(tags);
    }

    async function loadFilteredData(tag: string) {
        setLoading(true);
        try {
            // Parallel fetch of all modules
            const [actions, meetings, knowledge] = await Promise.all([
                actionsApi.fetchActions(),
                meetingsApi.fetchMeetings(),
                knowledgeApi.fetchPages(),
            ]);

            // Filter
            setResults({
                actions: actions.filter(a => a.tags?.includes(tag)),
                meetings: meetings.filter(m => m.tags?.includes(tag)),
                knowledge: knowledge.filter(k => k.tags?.includes(tag)),
            });
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    }

    const getTagColor = (tagName: string) => {
        const t = allTags.find(t => t.name === tagName);
        return t?.color || '#9ca3af';
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div>
                <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                    <Layers className="h-8 w-8" />
                    Global Filter
                </h1>
                <p className="text-text-muted mt-2">Filter all your work items by label.</p>
            </div>

            {/* Tag Cloud */}
            <div className="flex flex-wrap gap-2 p-4 bg-card border border-border rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mr-4 text-text-muted">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Select Label:</span>
                </div>
                {allTags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => setSearchParams({ tag: tag.name })}
                        className={`
                            px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                            ${activeTag === tag.name ? 'ring-2 ring-offset-2 ring-primary' : 'hover:opacity-80 opacity-70'}
                        `}
                        style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: tag.color
                        }}
                    >
                        {tag.name}
                    </button>
                ))}
            </div>

            {/* Application Content */}
            {activeTag && (
                <div className="flex-1 overflow-y-auto space-y-8 min-h-0 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Actions Column */}
                        <div className="space-y-4">
                            <h2 className="font-bold text-primary flex items-center gap-2 border-b border-border pb-2">
                                Actions
                                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{results.actions.length}</span>
                            </h2>
                            {results.actions.map(item => (
                                <Link to={`/actions/${item.id}`} key={item.id} className="block group">
                                    <div className="bg-card p-4 rounded-lg border border-border hover:shadow-md transition-all group-hover:border-primary">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-text group-hover:text-primary">{item.title}</h3>
                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                        </div>
                                        <p className="text-sm text-text-muted mt-1 line-clamp-2">{item.description}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded ${item.status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {loading && <p className="text-sm text-text-muted">Searching actions...</p>}
                            {!loading && results.actions.length === 0 && <p className="text-sm text-text-muted italic">No actions found.</p>}
                        </div>

                        {/* Meetings Column */}
                        <div className="space-y-4">
                            <h2 className="font-bold text-primary flex items-center gap-2 border-b border-border pb-2">
                                Meetings
                                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{results.meetings.length}</span>
                            </h2>
                            {results.meetings.map(item => (
                                <Link to={`/meetings/${item.id}`} key={item.id} className="block group">
                                    <div className="bg-card p-4 rounded-lg border border-border hover:shadow-md transition-all group-hover:border-primary">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-text group-hover:text-primary">{item.title}</h3>
                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                        </div>
                                        <p className="text-sm text-text-muted mt-1">{new Date(item.date_time).toLocaleString()}</p>
                                    </div>
                                </Link>
                            ))}
                            {!loading && results.meetings.length === 0 && <p className="text-sm text-text-muted italic">No meetings found.</p>}
                        </div>

                        {/* Knowledge Column */}
                        <div className="space-y-4">
                            <h2 className="font-bold text-primary flex items-center gap-2 border-b border-border pb-2">
                                Knowledge
                                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{results.knowledge.length}</span>
                            </h2>
                            {results.knowledge.map(item => (
                                <Link to={`/knowledge/${item.id}`} key={item.id} className="block group">
                                    <div className="bg-card p-4 rounded-lg border border-border hover:shadow-md transition-all group-hover:border-primary">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-text group-hover:text-primary">{item.title}</h3>
                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                        </div>
                                        {item.grid_area && <span className="text-xs bg-muted px-2 py-0.5 rounded mt-2 inline-block">{item.grid_area}</span>}
                                    </div>
                                </Link>
                            ))}
                            {!loading && results.knowledge.length === 0 && <p className="text-sm text-text-muted italic">No knowledge pages found.</p>}
                        </div>
                    </div>
                </div>
            )}

            {!activeTag && (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-50">
                    <TagIcon className="h-16 w-16 mb-4" />
                    <p className="text-lg">Select a label above to filter your work.</p>
                </div>
            )}
        </div>
    );
}
