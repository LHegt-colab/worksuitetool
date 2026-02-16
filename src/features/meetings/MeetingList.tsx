import { useState, useEffect } from 'react';
import { meetingsApi, type Meeting, type NewMeeting } from './api';
import { MeetingForm } from './MeetingForm';
import { Plus, Search, Calendar, MapPin, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function MeetingList() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined);
    const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');

    const loadMeetings = async () => {
        try {
            setLoading(true);
            const data = await meetingsApi.getMeetings();
            setMeetings(data);
        } catch (error) {
            console.error('Failed to load meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMeetings();
    }, []);

    const handleCreate = async (data: NewMeeting) => {
        if (!user) return;
        await meetingsApi.createMeeting({ ...data, user_id: user.id });
        loadMeetings();
    };

    const handleUpdate = async (data: NewMeeting) => {
        if (!editingMeeting) return;
        await meetingsApi.updateMeeting(editingMeeting.id, data);
        loadMeetings();
        setEditingMeeting(undefined);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this meeting?')) {
            await meetingsApi.deleteMeeting(id);
            loadMeetings();
        }
    };

    const openEdit = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingMeeting(undefined);
    };

    const filteredMeetings = meetings.filter(meeting =>
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (meeting.participants && meeting.participants.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-center">Loading meetings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Meeting
                </button>
            </div>

            <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search meetings..."
                        className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {filteredMeetings.map((meeting) => (
                    <div
                        key={meeting.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                    >
                        {/* Main Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-base text-card-foreground truncate">
                                    {meeting.title}
                                </h3>
                                <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded shrink-0">
                                    <Calendar className="mr-1.5 h-3 w-3" />
                                    {new Date(meeting.date_time).toLocaleString(undefined, {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                {meeting.location && (
                                    <div className="flex items-center">
                                        <MapPin className="mr-1.5 h-3.5 w-3.5" />
                                        <span className="truncate max-w-[150px]">{meeting.location}</span>
                                    </div>
                                )}
                                {meeting.participants && (
                                    <div className="flex items-center">
                                        <Users className="mr-1.5 h-3.5 w-3.5" />
                                        <span className="truncate max-w-[200px]">{meeting.participants}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags & Actions */}
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[200px]">
                                {meeting.tags?.map((tag, i) => (
                                    <span key={i} className="inline-flex items-center rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEdit(meeting)}
                                    className="text-xs font-medium text-primary hover:underline px-2 py-1"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(meeting.id)}
                                    className="text-xs font-medium text-destructive hover:underline px-2 py-1"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredMeetings.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                        <p>No meetings found.</p>
                    </div>
                )}
            </div>

            <MeetingForm
                isOpen={isFormOpen}
                initialData={editingMeeting}
                onSubmit={editingMeeting ? handleUpdate : handleCreate}
                onCancel={closeForm}
            />
        </div>
    );
}
