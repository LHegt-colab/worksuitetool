import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Clock, Filter, History, CalendarDays } from 'lucide-react';
import { meetingsApi, type Meeting, type NewMeeting } from './api';
import { tagsApi, type Tag } from '../tags/api';
import { MeetingForm } from './MeetingForm';
import { format, isPast, parseISO } from 'date-fns';

export function MeetingList() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // New State for Tabs and Filters
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [selectedLabelId, setSelectedLabelId] = useState<string>('all');

    const loadData = async () => {
        try {
            setLoading(true);
            const [meetingsData, tagsData] = await Promise.all([
                meetingsApi.getMeetings(),
                tagsApi.getTags()
            ]);
            setMeetings(meetingsData || []);
            setTags(tagsData || []);
        } catch (error) {
            console.error('Failed to load meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (data: NewMeeting) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await meetingsApi.createMeeting(data as any);
            setIsFormOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to create meeting:', error);
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingMeeting) return;
        try {
            await meetingsApi.updateMeeting(editingMeeting.id, data);
            setIsFormOpen(false);
            setEditingMeeting(undefined);
            loadData();
        } catch (error) {
            console.error('Failed to update meeting:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this meeting?')) return;
        try {
            await meetingsApi.deleteMeeting(id);
            setIsFormOpen(false);
            setEditingMeeting(undefined);
            loadData();
        } catch (error) {
            console.error('Failed to delete meeting:', error);
        }
    };

    const openEdit = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setIsFormOpen(true);
    };

    const getTagName = (id: string) => tags.find(t => t.id === id)?.name;
    const getTagColor = (id: string) => tags.find(t => t.id === id)?.color;

    // Filter Logic
    const filteredMeetings = meetings
        .filter(meeting => {
            // 1. Text Search
            const matchesSearch =
                meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (meeting.participants && meeting.participants.toLowerCase().includes(searchQuery.toLowerCase()));

            // 2. Tab Filter (Upcoming vs History)
            const meetingDate = parseISO(meeting.date_time);
            // "Upcoming" includes today and future. "History" is strictly past.
            const isHistory = isPast(meetingDate);

            if (activeTab === 'upcoming' && isHistory) return false;
            if (activeTab === 'history' && !isHistory) return false;

            // 3. Label Filter
            if (selectedLabelId !== 'all') {
                const hasLabel = meeting.label_ids?.includes(selectedLabelId);
                if (!hasLabel) return false;
            }

            return matchesSearch;
        })
        .sort((a, b) => {
            // Sort upcoming ascending (soonest first), history descending (newest first)
            const dateA = new Date(a.date_time).getTime();
            const dateB = new Date(b.date_time).getTime();
            return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
        });

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading meetings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
                <button
                    onClick={() => {
                        setEditingMeeting(undefined);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Meeting
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-all
                            ${activeTab === 'upcoming'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }
                        `}
                    >
                        <CalendarDays className="h-4 w-4" />
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-all
                            ${activeTab === 'history'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }
                        `}
                    >
                        <History className="h-4 w-4" />
                        History
                    </button>
                </div>

                <div className="flex flex-1 w-full md:w-auto items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search meetings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Label Filter */}
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

            {/* List View Container - Changed from grid to flex column */}
            <div className="flex flex-col gap-2">
                {filteredMeetings.length > 0 ? (
                    filteredMeetings.map((meeting) => (
                        <div
                            key={meeting.id}
                            onClick={() => openEdit(meeting)}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-all cursor-pointer hover:border-primary/50"
                        >
                            {/* Left: Date & Time Box */}
                            <div className="flex items-center gap-4 min-w-[180px]">
                                <div className="text-center bg-muted/30 rounded p-1.5 min-w-[3.5rem] border border-border/50">
                                    <div className="text-xs text-muted-foreground uppercase font-bold">
                                        {format(parseISO(meeting.date_time), 'MMM')}
                                    </div>
                                    <div className="text-xl font-bold text-foreground leading-none">
                                        {format(parseISO(meeting.date_time), 'dd')}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-sm font-semibold text-foreground">
                                        {format(parseISO(meeting.date_time), 'EEEE')}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{format(parseISO(meeting.date_time), 'HH:mm')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Title & Participants */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                                        {meeting.title}
                                    </h3>
                                    {isPast(parseISO(meeting.date_time)) && (
                                        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground border border-border">
                                            Past
                                        </span>
                                    )}
                                </div>
                                {meeting.participants && (
                                    <div className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                        {meeting.participants}
                                    </div>
                                )}
                            </div>

                            {/* Right: Labels */}
                            {(meeting.label_ids?.length || 0) > 0 && (
                                <div className="flex flex-wrap gap-2 sm:justify-end sm:max-w-[30%]">
                                    {meeting.label_ids?.map(id => {
                                        const color = getTagColor(id);
                                        return (
                                            <span
                                                key={id}
                                                className="px-2 py-0.5 text-xs rounded-full font-medium border whitespace-nowrap"
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
                    ))
                ) : (
                    <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border">
                        {searchQuery || selectedLabelId !== 'all'
                            ? 'No meetings found match your filters.'
                            : activeTab === 'upcoming'
                                ? 'No upcoming meetings scheduled.'
                                : 'No meeting history found.'
                        }
                    </div>
                )}
            </div>

            <MeetingForm
                isOpen={isFormOpen}
                initialData={editingMeeting}
                onCancel={() => {
                    setIsFormOpen(false);
                    setEditingMeeting(undefined);
                }}
                onSubmit={editingMeeting ? handleUpdate : handleCreate}
                onDelete={editingMeeting ? () => handleDelete(editingMeeting.id) : undefined}
            />
        </div>
    );
}
