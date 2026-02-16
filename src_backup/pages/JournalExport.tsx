import { useState } from 'react';
import { journalApi } from '../lib/api/journal';
import type { JournalEntry } from '../types';
import { ArrowLeft, Printer, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JournalExport() {
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10)); // Default 30 days
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    async function handleGenerate() {
        setLoading(true);
        try {
            // Fetch all entries, then filter locally (or better, add range query to API)
            // For now, assuming fetchAll exists or we iterate. 
            // Ideally we'd add `journalApi.getEntriesByRange(start, end)`
            // Let's assume we implement a simple range fetch or fetch all.
            // Since we don't have a range API yet, we'll fetch all and filter client side for this MVP.
            // CAUTION: Large datasets will suffer.

            // Temporary hack: fetch last 365 days if API doesn't support range
            // Or just fetch specific dates? 
            // We'll trust `journalApi.fetchEntries()` if it exists, otherwise we loop?
            // Let's implement `fetchEntries` in API to return list.

            const allEntries = await journalApi.fetchEntries();
            const filtered = allEntries.filter(e => e.date >= startDate && e.date <= endDate);

            // Sort by date desc
            filtered.sort((a, b) => b.date.localeCompare(a.date));

            setEntries(filtered);
            setGenerated(true);
        } catch (error) {
            console.error('Failed to generate report', error);
        } finally {
            setLoading(false);
        }
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6 print:p-0 print:max-w-none">
            {/* No-Print Header / Controls */}
            <div className="print:hidden space-y-6">
                <div className="flex items-center gap-4">
                    <Link to="/journal" className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-primary" />
                    </Link>
                    <h1 className="text-3xl font-bold text-primary">Export Journals</h1>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Select Date Range
                    </h2>
                    <div className="flex gap-4 flex-wrap">
                        <div className="space-y-1">
                            <label className="text-sm text-text-muted">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                                className="block w-full px-3 py-2 border border-border rounded-md bg-background"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-text-muted">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                                className="block w-full px-3 py-2 border border-border rounded-md bg-background"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 h-[42px]"
                            >
                                {loading ? 'Generating...' : 'Generate Report'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area (Printable) */}
            {generated && (
                <div className="space-y-8 print:space-y-8">
                    <div className="flex justify-between items-center border-b border-border pb-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold print:text-3xl">Journal Report</h1>
                            <p className="text-text-muted print:text-gray-600">
                                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                            </p>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="print:hidden flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            Print to PDF
                        </button>
                    </div>

                    {entries.length === 0 ? (
                        <p className="text-text-muted italic text-center py-10">No entries found in this period.</p>
                    ) : (
                        <div className="space-y-10">
                            {entries.map(entry => (
                                <article key={entry.id} className="break-inside-avoid">
                                    <h3 className="text-xl font-bold border-b border-border pb-2 mb-3 flex justify-between items-center text-primary print:text-black">
                                        {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        {entry.tags && entry.tags.length > 0 && (
                                            <div className="flex gap-2 print:hidden">
                                                {entry.tags.map(tag => (
                                                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-full font-normal text-text-muted">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </h3>
                                    <div className="prose max-w-none text-text print:text-black whitespace-pre-wrap leading-relaxed">
                                        {entry.content || <em className="text-text-muted">No content written.</em>}
                                    </div>

                                    {/* Linked Items Summary */}
                                    {(entry.linked_meeting_ids?.length || entry.linked_action_ids?.length || entry.linked_knowledge_ids?.length) ? (
                                        <div className="mt-4 pt-4 border-t border-border border-dashed text-sm text-text-muted grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                                            {entry.linked_meeting_ids && entry.linked_meeting_ids.length > 0 && (
                                                <div>
                                                    <span className="font-semibold block mb-1">Meetings:</span>
                                                    <ul className="list-disc list-inside">
                                                        {/* Note: We only have IDs here. Ideally we fetch titles. For now just counts or raw IDs? 
                                                            To do this right, we'd need to fetch referenced items. 
                                                            For MVP simplified export, we might skip titles or simple "3 Meetings linked".
                                                            Let's leave placeholder or simple count if we don't fetch all data.
                                                            BETTER: We fetched `allEntries` but not relations. 
                                                            If the user wants to see what meetings, we surely need titles.
                                                            We can pre-fetch all meetings/actions once in `handleGenerate`.
                                                        */}
                                                        <li>{entry.linked_meeting_ids.length} Linked Meetings</li>
                                                    </ul>
                                                </div>
                                            )}
                                            {entry.linked_action_ids && entry.linked_action_ids.length > 0 && (
                                                <div>
                                                    <span className="font-semibold block mb-1">Actions:</span>
                                                    <ul className="list-disc list-inside">
                                                        <li>{entry.linked_action_ids.length} Linked Actions</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
