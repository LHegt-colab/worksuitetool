import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { meetingsApi } from '../lib/api/meetings';
import type { Meeting } from '../types';

export default function Meetings() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMeetings();
    }, []);

    async function loadMeetings() {
        try {
            setLoading(true);
            const data = await meetingsApi.fetchMeetings();
            setMeetings(data);
        } catch (err) {
            setError('Failed to load meetings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-4">Loading meetings...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-primary">Meetings</h1>
                <Link
                    to="/meetings/new"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Meeting
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-text-muted">
                        No meetings found. Create one to get started.
                    </div>
                ) : (
                    meetings.map((meeting) => (
                        <Link
                            key={meeting.id}
                            to={`/meetings/${meeting.id}`}
                            className="block group"
                        >
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border group-hover:border-primary transition-all h-full flex flex-col">
                                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                    {meeting.title}
                                </h3>

                                <div className="space-y-2 text-sm text-text-muted mb-4 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {new Date(meeting.date_time).toLocaleDateString()} at{' '}
                                            {new Date(meeting.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {meeting.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span className="line-clamp-1">{meeting.location}</span>
                                        </div>
                                    )}
                                    {meeting.participants && (
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            <span className="line-clamp-1">{meeting.participants}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {meeting.grid_area && (
                                        <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                                            {meeting.grid_area}
                                        </span>
                                    )}
                                    {meeting.tags?.map((tag, i) => (
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
