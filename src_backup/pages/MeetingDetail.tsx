import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { meetingsApi } from '../lib/api/meetings';
import type { CreateMeetingDTO } from '../types';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import TagSelector from '../components/common/TagSelector';

export default function MeetingDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateMeetingDTO>({
        title: '',
        date_time: new Date().toISOString().slice(0, 16), // Format for datetime-local
        location: '',
        participants: '',
        notes: '',
        decisions: '',
        grid_area: '',
        tags: []
    });

    useEffect(() => {
        if (!isNew && id) {
            loadMeeting(id);
        }
    }, [id, isNew]);

    async function loadMeeting(meetingId: string) {
        try {
            setLoading(true);
            const meeting = await meetingsApi.getMeetingById(meetingId);
            setFormData({
                title: meeting.title,
                date_time: new Date(meeting.date_time).toISOString().slice(0, 16),
                location: meeting.location,
                participants: meeting.participants,
                notes: meeting.notes,
                decisions: meeting.decisions,
                grid_area: meeting.grid_area,
                tags: meeting.tags || []
            });
        } catch (err) {
            setError('Failed to load meeting');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSaving(true);
            const meetingData = {
                ...formData,
                date_time: new Date(formData.date_time).toISOString()
            };

            if (isNew) {
                await meetingsApi.createMeeting(meetingData as CreateMeetingDTO);
            } else if (id) {
                await meetingsApi.updateMeeting(id, meetingData);
            }
            navigate('/meetings');
        } catch (err) {
            setError('Failed to save meeting');
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!id || !window.confirm('Are you sure you want to delete this meeting?')) return;

        try {
            setSaving(true);
            await meetingsApi.deleteMeeting(id);
            navigate('/meetings');
        } catch (err) {
            setError('Failed to delete meeting');
            setSaving(false);
        }
    }

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/meetings')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-text-muted" />
                    </button>
                    <h1 className="text-3xl font-bold text-primary">
                        {isNew ? 'New Meeting' : 'Edit Meeting'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {!isNew && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Meeting"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            <div className="bg-card shadow-sm border border-border rounded-xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Meeting Title"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Date & Time</label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.date_time}
                            onChange={e => setFormData({ ...formData, date_time: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Location</label>
                        <input
                            type="text"
                            value={formData.location || ''}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Room or Link"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Participants</label>
                        <input
                            type="text"
                            value={formData.participants || ''}
                            onChange={e => setFormData({ ...formData, participants: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="John, Jane, ..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Grid Area</label>
                        <input
                            type="text"
                            value={formData.grid_area || ''}
                            onChange={e => setFormData({ ...formData, grid_area: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Project X"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Tags</label>
                    <TagSelector
                        selectedTags={formData.tags || []}
                        onChange={tags => setFormData({ ...formData, tags })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Notes</label>
                    <textarea
                        rows={6}
                        value={formData.notes || ''}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Meeting notes..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Decisions / Action Items</label>
                    <textarea
                        rows={4}
                        value={formData.decisions || ''}
                        onChange={e => setFormData({ ...formData, decisions: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Key decisions made..."
                    />
                </div>
            </div>
        </form>
    );
}
