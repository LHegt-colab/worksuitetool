import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Filter, Printer, Tag as TagIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { journalApi, type JournalEntry } from './api';
import { tagsApi, type Tag } from '../tags/api';
import { JournalForm } from './JournalForm';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function JournalList() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);

    // Filters
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLabelId, setSelectedLabelId] = useState<string>('all');

    // Expanded state for reading view
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const loadData = async () => {
        try {
            setLoading(true);
            const [journalData, tagsData] = await Promise.all([
                journalApi.getEntries(startDate, endDate),
                tagsApi.getTags()
            ]);
            setEntries(journalData || []);
            setTags(tagsData || []);
        } catch (error) {
            console.error('Failed to load journal entries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [startDate, endDate]); // Reload when date range changes

    const handleCreate = async (data: any) => {
        try {
            await journalApi.createEntry(data);
            setIsFormOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to create journal entry:', error);
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingEntry) return;
        try {
            await journalApi.updateEntry(editingEntry.id, data);
            setIsFormOpen(false);
            setEditingEntry(undefined);
            loadData();
        } catch (error) {
            console.error('Failed to update journal entry:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            await journalApi.deleteEntry(id);
            setIsFormOpen(false);
            setEditingEntry(undefined);
            loadData();
        } catch (error) {
            console.error('Failed to delete journal entry:', error);
        }
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const handlePrint = () => {
        window.print();
    };

    const getTagName = (id: string) => tags.find(t => t.id === id)?.name;
    const getTagColor = (id: string) => tags.find(t => t.id === id)?.color;

    // Client-side filtering
    const filteredEntries = entries.filter(entry => {
        // Search
        const matchesSearch =
            (entry.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (entry.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        // Label
        let matchesLabel = true;
        if (selectedLabelId !== 'all') {
            matchesLabel = entry.label_ids?.includes(selectedLabelId) || false;
        }

        return matchesSearch && matchesLabel;
    });

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading journal...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <h1 className="text-3xl font-bold text-foreground">Journal</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                    >
                        <Printer className="h-4 w-4" />
                        Print Report
                    </button>
                    <button
                        onClick={() => {
                            setEditingEntry(undefined);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Entry
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card p-4 rounded-lg border border-border flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-2">
                        {/* Added bg-background text-foreground to ensure visibility in dark mode */}
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-background text-foreground rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-muted-foreground">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-background text-foreground rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex flex-1 w-full md:w-auto items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search entries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

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

            {/* Print Styles Block - ensuring full content visibility during print */}
            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:text-black { color: black !important; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    /* Force expansion */
                    .line-clamp-3, .line-clamp-none { -webkit-line-clamp: unset !important; display: block !important; }
                }
            `}</style>

            <div className="space-y-4">
                {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => (
                        <div
                            key={entry.id}
                            className={`group rounded-lg border border-border bg-card p-5 transition-all
                                hover:border-primary/50 hover:shadow-sm
                                ${expandedIds.has(entry.id) ? 'active' : ''}
                                print:border-b print:border-black print:rounded-none print:shadow-none
                            `}
                            onClick={() => { setEditingEntry(entry); setIsFormOpen(true); }}
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => toggleExpand(entry.id, e)}
                                            className="p-1 -ml-2 rounded-full hover:bg-muted text-muted-foreground print:hidden"
                                        >
                                            {expandedIds.has(entry.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        <div>
                                            <div className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors print:text-black">
                                                {format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')}
                                            </div>
                                            {entry.title && (
                                                <div className="text-sm font-medium text-muted-foreground print:text-black">
                                                    {entry.title}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Labels */}
                                    {(entry.label_ids?.length || 0) > 0 && (
                                        <div className="flex flex-wrap gap-2 print:hidden">
                                            {entry.label_ids?.map(id => {
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
                                        </div>
                                    )}
                                </div>

                                {/* Content - Expanded or Clamped */}
                                <div className={`text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed print:text-black print:text-base
                                    ${expandedIds.has(entry.id) ? 'block' : 'line-clamp-3'}
                                `}>
                                    {entry.content}
                                </div>

                                {!expandedIds.has(entry.id) && entry.content && entry.content.length > 200 && (
                                    <button
                                        onClick={(e) => toggleExpand(entry.id, e)}
                                        className="text-xs text-primary font-medium hover:underline self-start print:hidden"
                                    >
                                        Read more
                                    </button>
                                )}

                                {/* Linked Items (Meetings/Actions) */}
                                {(entry.meeting_id || entry.action_id) && (
                                    // Fetch details could be done if we had them in context, for now just an indicator
                                    <div className="flex gap-4 pt-2 border-t border-border/50 text-xs text-muted-foreground print:hidden">
                                        {entry.meeting_id && <span className="flex items-center gap-1">Linked Meeting</span>}
                                        {entry.action_id && <span className="flex items-center gap-1">Linked Action</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border">
                        No journal entries found for this period.
                    </div>
                )}
            </div>

            <JournalForm
                isOpen={isFormOpen}
                initialData={editingEntry}
                onCancel={() => {
                    setIsFormOpen(false);
                    setEditingEntry(undefined);
                }}
                onSubmit={editingEntry ? handleUpdate : handleCreate}
                onDelete={editingEntry ? () => handleDelete(editingEntry.id) : undefined}
            />
        </div>
    );
}
