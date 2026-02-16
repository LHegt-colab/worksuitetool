import { useState, useEffect, useCallback } from 'react';
import { journalApi, type JournalEntry, type NewJournalEntry } from './api';
import { JournalForm } from './JournalForm';
import { Plus, Search, Calendar, Link2, CheckSquare } from 'lucide-react';
import { tagsApi, type Tag } from '../tags/api';
import { meetingsApi, type Meeting } from '../meetings/api';
import { actionsApi, type Action } from '../actions/api';
import { useAuth } from '../../contexts/AuthContext';

export function JournalList() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [actions, setActions] = useState<Action[]>([]);

    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
    const { user } = useAuth();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [entriesData, tagsData, meetingsData, actionsData] = await Promise.all([
                journalApi.getEntries(startDate, endDate),
                tagsApi.getTags(),
                meetingsApi.getMeetings(),
                actionsApi.getActions()
            ]);
            setEntries(entriesData || []);
            setTags(tagsData || []);
            setMeetings(meetingsData || []);
            setActions(actionsData || []);
        } catch (error) {
            console.error('Failed to load journal data:', error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePrint = () => {
        window.print();
    };

    const handleCreate = async (data: NewJournalEntry) => {
        if (!user) return;
        await journalApi.createEntry({ ...data, user_id: user.id });
        loadData();
    };

    const handleUpdate = async (data: NewJournalEntry) => {
        if (!editingEntry) return;
        await journalApi.updateEntry(editingEntry.id, data);
        loadData();
        setEditingEntry(undefined);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            await journalApi.deleteEntry(id);
            loadData();
        }
    };

    const openEdit = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingEntry(undefined);
    };

    const getTagDetails = (tagId: string) => tags.find(t => t.id === tagId);
    const getMeetingDetails = (id: string) => meetings.find(m => m.id === id);
    const getActionDetails = (id: string) => actions.find(a => a.id === id);

    const filteredEntries = entries.filter(entry =>
        (entry.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (entry.content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading journal...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <h1 className="text-2xl font-bold text-foreground">Journal</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        Print Report
                    </button>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Entry
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm print:hidden">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search journal..."
                        className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="rounded-md border border-input px-3 py-2 text-sm"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-md border border-input px-3 py-2 text-sm"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2 print:block print:space-y-4">
                {filteredEntries.map((entry) => (
                    <div
                        key={entry.id}
                        className="group flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md print:break-inside-avoid print:border-none print:shadow-none print:p-0"
                    >
                        {/* Left: Date & Title */}
                        <div className="w-full sm:w-1/4 min-w-[150px] shrink-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-semibold text-card-foreground truncate group-hover:text-primary transition-colors" title={entry.title}>
                                {entry.title || 'Untitled Entry'}
                            </h3>
                        </div>

                        {/* Center: Content Preview */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <p className="text-sm text-muted-foreground line-clamp-2 pr-4">
                                {entry.content || ''}
                            </p>

                            {/* Linked Items & Labels Inline */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {((entry.meeting_ids?.length || 0) > 0 || (entry.action_ids?.length || 0) > 0) && (
                                    <div className="flex flex-wrap gap-1 border-r border-border pr-2 mr-1">
                                        {entry.meeting_ids?.map(id => {
                                            const m = getMeetingDetails(id);
                                            if (!m) return null;
                                            return (
                                                <span key={id} className="inline-flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800" title={`Meeting: ${m.title}`}>
                                                    <Link2 className="h-3 w-3" /> <span className="truncate max-w-[100px]">{m.title}</span>
                                                </span>
                                            )
                                        })}
                                        {entry.action_ids?.map(id => {
                                            const a = getActionDetails(id);
                                            if (!a) return null;
                                            return (
                                                <span key={id} className="inline-flex items-center gap-1 text-[10px] text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800" title={`Action: ${a.title}`}>
                                                    <CheckSquare className="h-3 w-3" /> <span className="truncate max-w-[100px]">{a.title}</span>
                                                </span>
                                            )
                                        })}
                                    </div>
                                )}

                                {entry.label_ids?.map((labelId: string) => {
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
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 print:hidden self-start sm:self-center">
                            <button
                                onClick={() => openEdit(entry)}
                                className="text-xs font-medium text-primary hover:underline px-2 py-1"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-xs font-medium text-destructive hover:underline px-2 py-1"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {filteredEntries.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                        <p>No journal entries found.</p>
                    </div>
                )}
            </div>

            <JournalForm
                isOpen={isFormOpen}
                initialData={editingEntry}
                onSubmit={editingEntry ? handleUpdate : handleCreate}
                onCancel={closeForm}
            />
        </div>
    );
}
