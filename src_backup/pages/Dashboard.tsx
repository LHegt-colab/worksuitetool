import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api/dashboard';
import type { Meeting } from '../types';
import { LayoutDashboard, CheckSquare, Calendar, BookOpen, Clock, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();

    const [stats, setStats] = useState<{
        openActionsCount: number;
        todaysMeetings: Meeting[];
        hasJournalEntry: boolean;
    }>({
        openActionsCount: 0,
        todaysMeetings: [],
        hasJournalEntry: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            setLoading(true);
            const data = await dashboardApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-text-muted">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
                <p className="text-text-muted mt-2">Welcome back, {user?.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Actions Widget */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-text-muted text-sm font-medium">Open Actions</p>
                            <h3 className="text-4xl font-bold text-primary mt-2">{stats.openActionsCount}</h3>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <CheckSquare className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                        <Link to="/actions" className="text-sm text-primary hover:underline font-medium">
                            View all actions
                        </Link>
                        <Link to="/actions" className="p-2 hover:bg-muted rounded-full transition-colors text-primary" title="Create New Action">
                            <Plus className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Journal Widget */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-text-muted text-sm font-medium">Daily Journal</p>
                            <div className="mt-2 flex items-center gap-2">
                                {stats.hasJournalEntry ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Completed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                        Not started
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-3 bg-secondary rounded-full text-secondary-foreground">
                            <BookOpen className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-text-muted mb-6">
                        {stats.hasJournalEntry
                            ? "Great job reflecting on your day!"
                            : "Take a moment to reflect on your progress today."}
                    </p>
                    <div className="mt-auto pt-4 border-t border-border/50">
                        <Link to="/journal" className="flex items-center text-sm text-primary hover:underline font-medium">
                            {stats.hasJournalEntry ? 'Edit Entry' : 'Write Entry'} <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Knowledge/Quick Link Widget */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col justify-center items-center text-center space-y-4">
                    <div className="p-4 bg-accent/10 rounded-full text-accent mb-2">
                        <LayoutDashboard className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-text">Explore Knowledge Base</h3>
                    <Link to="/knowledge" className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium">
                        Go to Knowledge
                    </Link>
                </div>
            </div>

            {/* Today's Meetings Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Today's Meetings
                    </h2>
                    <Link to="/meetings/new" className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors font-medium">
                        + Scheduled Meeting
                    </Link>
                </div>

                {stats.todaysMeetings.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-8 text-center">
                        <div className="mx-auto h-12 w-12 text-text-muted mb-3 flex items-center justify-center bg-muted rounded-full">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <h3 className="text-text font-medium">No meetings scheduled for today</h3>
                        <p className="text-text-muted text-sm mt-1">Enjoy your focus time!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {stats.todaysMeetings.map((meeting) => (
                            <Link
                                key={meeting.id}
                                to={`/meetings/${meeting.id}`}
                                className="block group"
                            >
                                <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-all shadow-sm">
                                    <div className="flex flex-col items-center bg-primary/5 p-3 rounded-lg min-w-[80px]">
                                        <Clock className="h-5 w-5 text-primary mb-1" />
                                        <span className="text-sm font-bold text-text">
                                            {new Date(meeting.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-text group-hover:text-primary transition-colors">
                                            {meeting.title}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                                            {meeting.location && <span>📍 {meeting.location}</span>}
                                            {meeting.participants && <span>👥 {meeting.participants}</span>}
                                        </div>
                                    </div>
                                    <div className="p-2 text-text-muted group-hover:translate-x-1 transition-transform">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
