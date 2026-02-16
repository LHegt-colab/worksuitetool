import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Link as LinkIcon, X, Printer } from 'lucide-react';
import { journalApi } from '../lib/api/journal';
import { meetingsApi } from '../lib/api/meetings'; // Assuming this exists
import { actionsApi } from '../lib/api/actions';   // Assuming this exists
import { knowledgeApi } from '../lib/api/knowledge'; // Assuming this exists
import type { JournalEntry, Meeting, Action, KnowledgePage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TagSelector from '../components/common/TagSelector';

export default function Journal() {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [entry, setEntry] = useState<Partial<JournalEntry>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Relation Data
    const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
    const [allActions, setAllActions] = useState<Action[]>([]);
    const [allKnowledge, setAllKnowledge] = useState<KnowledgePage[]>([]);

    useEffect(() => {
        loadRelations();
    }, []);

    const loadRelations = async () => {
        try {
            // In a real app, we might want to filter these by date or recent usage
            // For now, we fetch all as requested ("dropdown met alle beschikbare acties")
            const [meetings, actions, knowledge] = await Promise.all([
                meetingsApi.fetchMeetings().catch(() => []),
                actionsApi.fetchActions().catch(() => []),
                knowledgeApi.fetchPages().catch(() => [])
            ]);
            setAllMeetings(meetings);
            setAllActions(actions);
            setAllKnowledge(knowledge);
        } catch (error) {
            console.error('Failed to load relations', error);
        }
    };

    const loadEntry = useCallback(async (dateString: string) => {
        try {
            setLoading(true);
            const data = await journalApi.getEntryByDate(dateString);
            if (data) {
                setEntry(data);
            } else {
                setEntry({
                    content: '',
                    linked_meeting_ids: [],
                    linked_action_ids: [],
                    linked_knowledge_ids: []
                });
            }
        } catch (error) {
            console.error('Failed to load entry:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntry(date);
    }, [date, loadEntry]);

    const handleSave = async () => {
        if (!user) return;
        try {
            setSaving(true);
            const payload = {
                user_id: user.id,
                date,
                content: entry.content,
                linked_meeting_ids: entry.linked_meeting_ids,
                linked_action_ids: entry.linked_action_ids,
                linked_knowledge_ids: entry.linked_knowledge_ids,
            };

            const saved = await journalApi.upsertEntry(payload);
            setEntry(saved);
            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save entry:', error);
        } finally {
            setSaving(false);
        }
    };

    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        setDate(newDate.toISOString().slice(0, 10));
    };

    const toggleRelation = (type: 'meeting' | 'action' | 'knowledge', id: string) => {
        const key = type === 'meeting' ? 'linked_meeting_ids'
            : type === 'action' ? 'linked_action_ids'
                : 'linked_knowledge_ids';

        const currentIds = entry[key] || [];
        const newIds = currentIds.includes(id)
            ? currentIds.filter(i => i !== id)
            : [...currentIds, id];

        setEntry({ ...entry, [key]: newIds });
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-primary">Journal</h1>
                    <div className="flex items-center bg-card border border-border rounded-md shadow-sm">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-muted text-text-muted hover:text-text transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="px-4 py-2 font-medium flex items-center gap-2 border-l border-r border-border min-w-[200px] justify-center">
                            <CalendarIcon className="h-4 w-4 text-text-muted" />
                            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-muted text-text-muted hover:text-text transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {lastSaved && (
                        <span className="text-sm text-text-muted">
                            Saved {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <Link
                        to="/journal/export"
                        className="p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                        title="Export Journals"
                    >
                        <Printer className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-text-muted">Loading entry...</div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 bg-card shadow-sm border border-border rounded-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <label className="font-semibold text-primary">Today's Story</label>
                        </div>
                        <textarea
                            value={entry.content || ''}
                            onChange={e => setEntry({ ...entry, content: e.target.value })}
                            className="flex-1 w-full p-6 bg-background text-text focus:outline-none resize-none text-lg leading-relaxed"
                            placeholder="Write about your day..."
                        />
                    </div>

                    {/* Sidebar: Relations */}
                    <div className="bg-card shadow-sm border border-border rounded-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h2 className="font-semibold text-primary flex items-center gap-2">
                                <LinkIcon className="h-4 w-4" />
                                Linked Items
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Tags</label>
                                <TagSelector
                                    selectedTags={entry.tags || []}
                                    onChange={tags => setEntry({ ...entry, tags })}
                                />
                            </div>

                            <hr className="border-border" />

                            {/* Meetings Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Meetings</label>
                                <select
                                    className="w-full p-2 border border-border rounded-md bg-background text-sm"
                                    onChange={(e) => {
                                        if (e.target.value) toggleRelation('meeting', e.target.value);
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">+ Link a meeting...</option>
                                    {allMeetings.filter(m => !entry.linked_meeting_ids?.includes(m.id)).map(m => (
                                        <option key={m.id} value={m.id}>
                                            {new Date(m.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {m.title}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2">
                                    {entry.linked_meeting_ids?.map(id => {
                                        const item = allMeetings.find(m => m.id === id);
                                        if (!item) return null;
                                        return (
                                            <div key={id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-200">
                                                <span className="truncate max-w-[150px]">{item.title}</span>
                                                <button onClick={() => toggleRelation('meeting', id)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Actions</label>
                                <select
                                    className="w-full p-2 border border-border rounded-md bg-background text-sm"
                                    onChange={(e) => {
                                        if (e.target.value) toggleRelation('action', e.target.value);
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">+ Link an action...</option>
                                    {allActions.filter(a => !entry.linked_action_ids?.includes(a.id)).map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.title} ({a.status})
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2">
                                    {entry.linked_action_ids?.map(id => {
                                        const item = allActions.find(a => a.id === id);
                                        if (!item) return null;
                                        return (
                                            <div key={id} className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs border border-green-200">
                                                <span className="truncate max-w-[150px]">{item.title}</span>
                                                <button onClick={() => toggleRelation('action', id)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Knowledge Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Knowledge</label>
                                <select
                                    className="w-full p-2 border border-border rounded-md bg-background text-sm"
                                    onChange={(e) => {
                                        if (e.target.value) toggleRelation('knowledge', e.target.value);
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">+ Link knowledge...</option>
                                    {allKnowledge.filter(k => !entry.linked_knowledge_ids?.includes(k.id)).map(k => (
                                        <option key={k.id} value={k.id}>
                                            {k.title}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2">
                                    {entry.linked_knowledge_ids?.map(id => {
                                        const item = allKnowledge.find(k => k.id === id);
                                        if (!item) return null;
                                        return (
                                            <div key={id} className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs border border-purple-200">
                                                <span className="truncate max-w-[150px]">{item.title}</span>
                                                <button onClick={() => toggleRelation('knowledge', id)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
