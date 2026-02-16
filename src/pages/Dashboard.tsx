import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { actionsApi, type Action } from '../features/actions/api';
import { meetingsApi, type Meeting } from '../features/meetings/api';
import { timeApi, type TimeEntry } from '../features/time/api';
import { journalApi, type JournalEntry } from '../features/journal/api';
import { knowledgeApi, type KnowledgePage } from '../features/knowledge/api';
import { format, isSameDay, isAfter, parseISO, startOfDay, isBefore } from 'date-fns';
import {
    Search,
    Calendar,
    CheckSquare,
    Clock,
    BookOpen,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [actions, setActions] = useState<Action[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [knowledgePages, setKnowledgePages] = useState<KnowledgePage[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {

                const [a, m, t, j, k] = await Promise.all([
                    actionsApi.getActions(),
                    meetingsApi.getMeetings(),
                    timeApi.getEntries(), // get all for stats
                    journalApi.getEntries(),
                    knowledgeApi.getPages()
                ]);

                setActions(a || []);
                setMeetings(m || []);
                setTimeEntries(t || []);
                setJournalEntries(j || []);
                setKnowledgePages(k || []);
            } catch (e) {
                console.error("Failed to load dashboard data", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // --- Stats ---
    const now = new Date();
    const todayStart = startOfDay(now);

    const upcomingMeetings = meetings
        .filter(m => isAfter(parseISO(m.date_time), now))
        .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
        .slice(0, 3);

    const overdueActions = actions.filter(a =>
        a.status !== 'Done' &&
        a.status !== 'Archived' &&
        a.due_date &&
        isBefore(parseISO(a.due_date), todayStart)
    );

    const pendingActions = actions.filter(a =>
        (a.status === 'Open' || a.status === 'Doing' || a.status === 'Waiting')
    );

    const timeLoggedToday = timeEntries
        .filter(t => isSameDay(parseISO(t.date), now))
        .reduce((acc, t) => acc + t.duration, 0);

    const journalToday = journalEntries.filter(j => isSameDay(parseISO(j.date), now)).length;

    // --- Search ---
    const searchResults = searchQuery.trim() === '' ? [] : [
        ...actions.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).map(i => ({ type: 'Action', ...i, link: '/actions' })),
        ...meetings.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map(i => ({ type: 'Meeting', ...i, link: '/meetings' })),
        ...knowledgePages.filter(k => k.title.toLowerCase().includes(searchQuery.toLowerCase())).map(i => ({ type: 'Knowledge', ...i, link: '/knowledge' })),
        ...journalEntries.filter(j => j.title.toLowerCase().includes(searchQuery.toLowerCase())).map(i => ({ type: 'Journal', ...i, link: '/journal' })),
    ].slice(0, 5);


    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {getGreeting()}, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Here's what's happening today.
                    </p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search everything..."
                        className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 w-full rounded-md border border-border bg-popover shadow-md z-50 overflow-hidden">
                            {searchResults.map((result, i) => (
                                <Link key={i} to={result.link} className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                                    <span className="font-semibold text-xs uppercase text-muted-foreground mr-2">{result.type}</span>
                                    {result.title}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <CheckSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pending Actions</p>
                            <h3 className="text-2xl font-bold text-foreground">{pendingActions.length}</h3>
                        </div>
                    </div>
                    {overdueActions.length > 0 && (
                        <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {overdueActions.length} overdue
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Next Meeting</p>
                            <h3 className="text-md font-bold text-foreground truncate max-w-[150px]">
                                {upcomingMeetings[0] ? format(parseISO(upcomingMeetings[0].date_time), 'HH:mm') : '-'}
                            </h3>
                            {upcomingMeetings[0] && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{upcomingMeetings[0].title}</p>}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Time Tracked</p>
                            <h3 className="text-2xl font-bold text-foreground">{(timeLoggedToday / 60).toFixed(1)}h</h3>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Today</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                            <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Journal</p>
                            <h3 className="text-2xl font-bold text-foreground">{journalToday}</h3>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Entries today</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">Upcoming Meetings</h3>
                        <p className="text-sm text-muted-foreground">Your schedule for the next few days.</p>
                    </div>
                    <div className="p-6 pt-0">
                        {upcomingMeetings.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No upcoming meetings.</p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingMeetings.map(meeting => (
                                    <div key={meeting.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{meeting.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(parseISO(meeting.date_time), 'MMM d, yyyy - HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-border">
                            <Link to="/meetings" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                View all meetings <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold leading-none tracking-tight">Action Items</h3>
                                <p className="text-sm text-muted-foreground">Tasks needing your attention.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 pt-0">
                        {pendingActions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No pending actions.</p>
                        ) : (
                            <div className="space-y-4">
                                {pendingActions.slice(0, 5).map(action => (
                                    <div key={action.id} className="flex items-center gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                                        <div className={`w-2 h-2 rounded-full ${action.priority === 'High' ? 'bg-red-500' :
                                            action.priority === 'Medium' ? 'bg-yellow-500' :
                                                'bg-blue-500'
                                            }`} />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none truncate">{action.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{action.status}</span>
                                                {action.due_date && (
                                                    <span className={isBefore(parseISO(action.due_date), todayStart) ? 'text-destructive font-medium' : ''}>
                                                        Due: {action.due_date}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-border">
                            <Link to="/actions" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                Manage actions <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
