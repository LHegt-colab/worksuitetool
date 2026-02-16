import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutList, CalendarDays, Grid3X3, ArrowLeft } from 'lucide-react';
import { meetingsApi } from '../lib/api/meetings';
import { actionsApi } from '../lib/api/actions';
import { timeApi } from '../lib/api/time';
import type { Meeting, Action, WorkEntry, VacationTransaction, Tag } from '../types';
import CalendarMonth from '../components/Calendar/CalendarMonth';
import CalendarDay from '../components/Calendar/CalendarDay';
import CalendarYear from '../components/Calendar/CalendarYear';
import CreateItemModal from '../components/Calendar/CreateItemModal';

export default function Calendar() {
    type ViewType = 'day' | 'week' | 'month' | 'year';
    const [view, setView] = useState<ViewType>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>('09:00');

    // Data State
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
    const [vacationDays, setVacationDays] = useState<VacationTransaction[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        if (view !== 'year') {
            fetchData();
        }
    }, [currentDate, view]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Determine fetch range based on View
            let startStr: string, endStr: string;
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            if (view === 'day') {
                // For day view, maybe fetch surrounding week?
                const d = new Date(currentDate);
                d.setDate(d.getDate() - 2);
                startStr = d.toISOString();
                d.setDate(d.getDate() + 5);
                endStr = d.toISOString();
            } else {
                // Month/Week (fetch surrounding months for safety)
                startStr = new Date(year, month - 1, 1).toISOString();
                endStr = new Date(year, month + 2, 0).toISOString();
            }

            const [fetchedMeetings, fetchedActions, fetchedWork, fetchedVacation, fetchedTags] = await Promise.all([
                meetingsApi.fetchMeetings(startStr, endStr),
                actionsApi.fetchActions(startStr, endStr),
                timeApi.fetchWorkEntries(startStr, endStr),
                timeApi.fetchVacationTransactions(),
                import('../lib/api/settings').then(({ settingsApi }) => settingsApi.fetchTags())
            ]);

            setMeetings(fetchedMeetings);
            setActions(fetchedActions);
            setWorkEntries(fetchedWork);
            setVacationDays(fetchedVacation);
            setTags(fetchedTags);
        } catch (error) {
            console.error("Failed to load calendar data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setSelectedTime('09:00');
        setIsModalOpen(true);
    };

    const handleTimeSlotClick = (date: Date, time: string) => {
        setSelectedDate(date);
        setSelectedTime(time);
        setIsModalOpen(true);
    };

    const navigate = (delta: number) => {
        const newDate = new Date(currentDate);
        if (view === 'month') {
            newDate.setMonth(newDate.getMonth() + delta);
        } else if (view === 'year') {
            newDate.setFullYear(newDate.getFullYear() + delta);
        } else {
            // Day or Week
            newDate.setDate(newDate.getDate() + delta * (view === 'week' ? 7 : 1));
        }
        setCurrentDate(newDate);
    };

    const getViewLabel = () => {
        if (view === 'year') return currentDate.getFullYear().toString();
        if (view === 'month') return currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
        // Day
        return currentDate.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
            <CreateItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchData();
                    setIsModalOpen(false);
                }}
                defaultDate={selectedDate}
                defaultTime={selectedTime}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">Calendar</h1>
                        <p className="text-sm text-text-muted hidden md:block">Manage your schedule and deadlines</p>
                    </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-lg shadow-sm">
                    <button
                        onClick={() => setView('day')}
                        className={`p-2 rounded-md text-sm font-medium transition-all ${view === 'day' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:bg-muted'}`}
                    >
                        Day
                    </button>
                    <button
                        onClick={() => setView('month')}
                        className={`p-2 rounded-md text-sm font-medium transition-all ${view === 'month' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:bg-muted'}`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setView('year')}
                        className={`p-2 rounded-md text-sm font-medium transition-all ${view === 'year' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:bg-muted'}`}
                    >
                        Year
                    </button>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md border border-border bg-card transition-colors">
                        Today
                    </button>
                    <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
                        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-md"><ChevronLeft className="h-5 w-5" /></button>
                        <span className="font-semibold text-sm w-40 text-center truncate px-2">
                            {getViewLabel()}
                        </span>
                        <button onClick={() => navigate(1)} className="p-1 hover:bg-muted rounded-md"><ChevronRight className="h-5 w-5" /></button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-hidden transition-opacity duration-200 ${loading ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
                {view === 'month' && (
                    <CalendarMonth
                        currentDate={currentDate}
                        meetings={meetings}
                        actions={actions}
                        workEntries={workEntries}
                        vacationDays={vacationDays}
                        tags={tags}
                        onDayClick={handleDayClick}
                    />
                )}
                {view === 'day' && (
                    <CalendarDay
                        currentDate={currentDate}
                        meetings={meetings}
                        actions={actions}
                        workEntries={workEntries}
                        vacationDays={vacationDays}
                        tags={tags}
                        onTimeSlotClick={handleTimeSlotClick}
                    />
                )}
                {view === 'year' && (
                    <CalendarYear
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        setView={(v) => setView(v)}
                    />
                )}
            </div>
        </div>
    );
}
