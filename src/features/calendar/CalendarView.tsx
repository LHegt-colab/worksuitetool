import { useState, useEffect } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isSameDay,
    parseISO,
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
    addDays,
    subDays,
    startOfYear,
    endOfYear,
    eachMonthOfInterval,
    addYears,
    subYears,
    isSameMonth
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, CheckSquare, Plus } from 'lucide-react';
import { actionsApi, type Action } from '../actions/api';
import { meetingsApi, type Meeting } from '../meetings/api';
import { tagsApi, type Tag } from '../tags/api';
import { ActionForm } from '../actions/ActionForm';
import { MeetingForm } from '../meetings/MeetingForm';

type ViewMode = 'day' | 'week' | 'month' | 'year';

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewMode>('week');
    const [actions, setActions] = useState<Action[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isActionFormOpen, setIsActionFormOpen] = useState(false);
    const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false);

    // Check specific item for editing
    const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined);
    const [editingAction, setEditingAction] = useState<Action | undefined>(undefined);

    const loadData = async () => {
        try {
            setLoading(true);
            const [actionsData, meetingsData, tagsData] = await Promise.all([
                actionsApi.getActions(),
                meetingsApi.getMeetings(),
                tagsApi.getTags()
            ]);
            setActions(actionsData || []);
            setMeetings(meetingsData || []);
            setTags(tagsData || []);
        } catch (error) {
            console.error('Failed to load calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateAction = async (data: any) => {
        try {
            await actionsApi.createAction(data);
            setIsActionFormOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to create action:', error);
        }
    };

    const handleUpdateAction = async (data: any) => {
        if (!editingAction) return;
        try {
            await actionsApi.updateAction(editingAction.id, data);
            setIsActionFormOpen(false);
            setEditingAction(undefined);
            loadData();
        } catch (error) {
            console.error('Failed to update action:', error);
        }
    };

    const handleCreateMeeting = async (data: any) => {
        try {
            await meetingsApi.createMeeting(data);
            setIsMeetingFormOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to create meeting:', error);
        }
    };

    const handleUpdateMeeting = async (data: any) => {
        if (!editingMeeting) return;
        try {
            await meetingsApi.updateMeeting(editingMeeting.id, data);
            setIsMeetingFormOpen(false);
            setEditingMeeting(undefined);
            loadData();
        } catch (error) {
            console.error('Failed to update meeting:', error);
        }
    };

    // Open handlers
    const openNewMeeting = () => {
        setEditingMeeting(undefined);
        setIsMeetingFormOpen(true);
    };

    const openEditMeeting = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setIsMeetingFormOpen(true);
    };

    const openNewAction = () => {
        setEditingAction(undefined);
        setIsActionFormOpen(true);
    };

    const openEditAction = (action: Action) => {
        setEditingAction(action);
        setIsActionFormOpen(true);
    };

    const closeMeetingForm = () => {
        setIsMeetingFormOpen(false);
        setEditingMeeting(undefined);
    };

    const closeActionForm = () => {
        setIsActionFormOpen(false);
        setEditingAction(undefined);
    };

    const navigate = (direction: 'prev' | 'next') => {
        if (view === 'day') setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
        if (view === 'week') setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        if (view === 'month') setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        if (view === 'year') setCurrentDate(direction === 'prev' ? subYears(currentDate, 1) : addYears(currentDate, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    // Helper: Calculate Saturation from Hex
    const getSaturation = (hex: string) => {
        // Remove hash if present
        hex = hex.replace(/^#/, '');

        // Parse r, g, b
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        // Saturation logic (HSV/HSB model often used for 'colorfulness')
        // If max is 0, saturation is 0. 
        if (max === 0) return 0;
        return delta / max;
    };

    // Helper: Get Color for Item
    const getItemStyle = (item: Meeting | Action) => {
        // Prioritize label_ids (Source of Truth)
        let matchedTags: Tag[] = [];

        if (item.label_ids && item.label_ids.length > 0) {
            matchedTags = item.label_ids
                .map(id => tags.find(t => t.id === id))
                .filter((t): t is Tag => !!t);
        }

        // Fallback to tag names if label_ids are missing/empty
        if (matchedTags.length === 0 && item.tags && item.tags.length > 0) {
            matchedTags = item.tags
                .map(tagName => tags.find(t => t.name === tagName))
                .filter((t): t is Tag => !!t);
        }

        // Default Colors
        const isMeeting = 'date_time' in item;
        const defaultColor = isMeeting ? '#3b82f6' : '#22c55e';

        // Intelligent Color Selection:
        // Prioritize: 
        // 1. High Saturation (Colorful labels beat Gray/Black/White labels)
        // 2. Last in list (if saturations are similar, prefer recently added tag)
        let selectedColor = defaultColor;

        if (matchedTags.length > 0) {
            // Sort by saturation descending. 
            const sortedTags = matchedTags.map(t => ({
                tag: t,
                sat: getSaturation(t.color || '#000000')
            })).sort((a, b) => b.sat - a.sat);

            // Use the most saturated tag's color
            selectedColor = sortedTags[0].tag.color || defaultColor;
        }

        return {
            background: `color-mix(in srgb, ${selectedColor}, transparent 85%)`,
            borderLeft: `5px solid ${selectedColor}`, // Increased to 5px
            color: 'inherit',
        };
    };

    // --- Render Logic ---

    // 1. Header
    const renderHeader = () => {
        let titleFormat = 'MMMM yyyy';
        if (view === 'day') titleFormat = 'EEEE, MMMM d, yyyy';
        if (view === 'year') titleFormat = 'yyyy';

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-foreground capitalize">
                        {format(currentDate, titleFormat)}
                    </h1>
                    <div className="flex items-center gap-1 rounded-md border border-input p-1 bg-card">
                        <button onClick={() => navigate('prev')} className="p-1 hover:bg-accent rounded text-foreground"><ChevronLeft className="h-4 w-4" /></button>
                        <button onClick={handleToday} className="px-3 text-sm font-medium hover:bg-accent rounded text-foreground">Today</button>
                        <button onClick={() => navigate('next')} className="p-1 hover:bg-accent rounded text-foreground"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-md border border-input p-1 bg-card">
                        {(['day', 'week', 'month', 'year'] as ViewMode[]).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1.5 text-sm font-medium rounded capitalize transition-colors
                                    ${view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}
                                `}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openNewMeeting}
                            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" />
                            Meeting
                        </button>
                        <button
                            onClick={openNewAction}
                            className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                        >
                            <Plus className="h-4 w-4" />
                            Action
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // 2. Year View
    const renderYearView = () => {
        const start = startOfYear(currentDate);
        const end = endOfYear(currentDate);
        const months = eachMonthOfInterval({ start, end });

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto flex-1 min-h-0">
                {months.map(month => (
                    <div
                        key={month.toString()}
                        className="rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors cursor-pointer"
                        onClick={() => {
                            setCurrentDate(month);
                            setView('month');
                        }}
                    >
                        <div className="font-semibold text-lg mb-2 text-foreground">{format(month, 'MMMM')}</div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-xs">
                            {eachDayOfInterval({
                                start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
                                end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
                            }).map((day, dIdx) => {
                                const isCurrentMonth = isSameMonth(day, month);
                                const isToday = isSameDay(day, new Date());
                                return (
                                    <div
                                        key={dIdx}
                                        className={`p-1 rounded-full text-center
                                            ${!isCurrentMonth ? 'opacity-20' : ''}
                                            ${isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // 3. Month View (Grid)
    const renderMonthView = () => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });

        return (
            <div className="grid grid-cols-7 grid-rows-[auto_repeat(6,1fr)] gap-px bg-border rounded-lg border border-border flex-1 overflow-hidden min-h-0">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                    <div key={d} className={`bg-card p-2 text-center text-sm font-medium text-muted-foreground border-b border-border ${i === 6 ? 'text-red-500' : ''}`}>
                        {d}
                    </div>
                ))}

                {days.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    // Filter items for this day
                    const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.date_time), day));
                    const dayActions = actions.filter(a => {
                        const start = a.start_date ? parseISO(a.start_date) : (a.created_at ? parseISO(a.created_at) : new Date());
                        if (a.status === 'Done' || a.status === 'Archived') return false;
                        return isSameDay(start, day);
                    });

                    return (
                        <div
                            key={day.toString()}
                            className={`flex flex-col bg-card min-h-[100px] overflow-hidden group ${!isCurrentMonth ? 'bg-accent/5' : ''}`}
                        >
                            <div className={`p-2 border-b border-border/50 flex items-center justify-between ${isToday ? 'bg-primary/5 text-primary' : ''}`}>
                                <span className="font-semibold">{format(day, 'd')}</span>
                                {!isCurrentMonth && <span className="text-xs text-muted-foreground">{format(day, 'MMM')}</span>}
                            </div>
                            <div className="flex-1 p-1 space-y-1 overflow-y-auto">
                                {[...dayMeetings, ...dayActions].slice(0, 4).map((item, idx) => {
                                    const isMeeting = 'date_time' in item;
                                    const time = isMeeting ? format(parseISO((item as Meeting).date_time), 'HH:mm') : null;
                                    const style = getItemStyle(item as Meeting | Action);

                                    return (
                                        <div
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isMeeting) openEditMeeting(item as Meeting);
                                                else openEditAction(item as Action);
                                            }}
                                            // Changed classes: Removed bg/border colors, added explicit text color
                                            className="rounded-sm mb-1 px-1.5 py-1 text-xs truncate flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity text-foreground font-medium"
                                            style={style}
                                        >
                                            {isMeeting ? <Clock className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
                                            {time && <span className="opacity-70">{time}</span>}
                                            <span className="truncate">{item.title}</span>
                                        </div>
                                    );
                                })}
                                {((dayMeetings.length + dayActions.length) > 4) && (
                                    <div className="text-[10px] text-muted-foreground pl-1">+ {dayMeetings.length + dayActions.length - 4} more</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // 4. Time Grid View (Day/Week)
    const renderTimeGridView = () => {
        const start = view === 'day' ? currentDate : startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = view === 'day' ? currentDate : endOfWeek(currentDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const CELL_HEIGHT = 60; // px per hour

        return (
            <div className="flex flex-col flex-1 overflow-hidden bg-card border rounded-lg border-border">
                {/* Header Row: Days */}
                <div className="flex border-b border-border">
                    <div className="w-16 shrink-0 border-r border-border bg-muted/30"></div> {/* Time gutter header */}
                    <div className={`grid flex-1 ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                        {days.map((day) => {
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={day.toString()} className={`p-2 text-center border-r border-border last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}>
                                    <div className="text-xs uppercase text-muted-foreground">{format(day, 'EEE')}</div>
                                    <div className={`text-xl font-bold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* All Day Row (Actions) */}
                <div className="flex border-b border-border min-h-[40px]">
                    <div className="w-16 shrink-0 border-r border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground p-2">
                        All Day
                    </div>
                    <div className={`grid flex-1 ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                        {days.map((day) => {
                            // Filter actions for this day
                            const dayActions = actions.filter(a => {
                                if (a.status === 'Done' || a.status === 'Archived') return false;
                                const start = a.start_date ? parseISO(a.start_date) : (a.created_at ? parseISO(a.created_at) : new Date());
                                return isSameDay(start, day);
                            });

                            return (
                                <div key={day.toString()} className="border-r border-border last:border-r-0 p-1 space-y-1">
                                    {dayActions.map(action => {
                                        const style = getItemStyle(action);
                                        return (
                                            <div
                                                key={action.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditAction(action);
                                                }}
                                                // Removed hardcoded green classes
                                                className="text-xs rounded-sm mb-1 px-1 py-0.5 truncate flex items-center gap-1 cursor-pointer hover:opacity-80 text-foreground font-medium"
                                                style={style}
                                            >
                                                <CheckSquare className="h-3 w-3 shrink-0" />
                                                {action.title}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Scrollable Time Grid */}
                <div className="flex-1 overflow-y-auto relative bg-background">
                    <div className="flex h-[1440px]"> {/* 24h * 60px */}

                        {/* Time labels Sidebar */}
                        <div className="w-16 shrink-0 border-r border-border bg-muted/10 relative">
                            {hours.map(hour => (
                                <div key={hour} className="absolute w-full text-right pr-2 text-xs text-muted-foreground -mt-2" style={{ top: hour * CELL_HEIGHT }}>
                                    {hour}:00
                                </div>
                            ))}
                        </div>

                        {/* Grid Columns */}
                        <div className={`grid flex-1 h-full ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                            {days.map((day) => {
                                // Horizontal grid lines
                                return (
                                    <div key={day.toString()} className="relative border-r border-border last:border-r-0">
                                        {/* Hour lines */}
                                        {hours.map(hour => (
                                            <div key={hour} className="absolute w-full border-t border-border/30 h-[60px]" style={{ top: hour * CELL_HEIGHT }}></div>
                                        ))}

                                        {/* Meetings positioned absolutely */}
                                        {meetings
                                            .filter(m => isSameDay(parseISO(m.date_time), day))
                                            .map(meeting => {
                                                const dt = parseISO(meeting.date_time);
                                                const startMinutes = dt.getHours() * 60 + dt.getMinutes();
                                                const top = (startMinutes / 60) * CELL_HEIGHT;
                                                const height = CELL_HEIGHT; // Default 1 hour duration
                                                const style = getItemStyle(meeting);

                                                return (
                                                    <div
                                                        key={meeting.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditMeeting(meeting);
                                                        }}
                                                        // Removed hardcoded blue classes
                                                        className="absolute left-1 right-1 rounded-sm p-1 text-xs overflow-hidden cursor-pointer hover:shadow-md z-10 hover:opacity-90 text-foreground font-medium"
                                                        style={{ top, height, minHeight: '30px', ...style }}
                                                    >
                                                        <div className="font-semibold">{periodString(dt)}</div>
                                                        <div className="font-medium truncate">{meeting.title}</div>
                                                    </div>
                                                );
                                            })
                                        }

                                        {/* Current time line indicator (if today) */}
                                        {isSameDay(day, new Date()) && (
                                            <div
                                                className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none"
                                                style={{ top: (new Date().getHours() * 60 + new Date().getMinutes()) / 60 * CELL_HEIGHT }}
                                            >
                                                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const periodString = (date: Date) => format(date, 'HH:mm');

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading calendar...</div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-0">
            {renderHeader()}

            {view === 'year' && renderYearView()}
            {view === 'month' && renderMonthView()}
            {(view === 'week' || view === 'day') && renderTimeGridView()}

            {/* Modals */}
            <MeetingForm
                isOpen={isMeetingFormOpen}
                initialData={editingMeeting}
                onCancel={closeMeetingForm}
                onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
            />

            <ActionForm
                isOpen={isActionFormOpen}
                initialData={editingAction}
                onCancel={closeActionForm}
                onSubmit={editingAction ? handleUpdateAction : handleCreateAction}
            />
        </div>
    );
}
