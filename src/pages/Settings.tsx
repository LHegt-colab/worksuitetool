import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { settingsApi, type Settings, type NewSettings } from '../features/settings/api';
import { journalApi, type JournalEntry } from '../features/journal/api';
import { TagManager } from '../features/tags/TagManager';
import { Save, FileText, Settings as SettingsIcon, Tag as TagIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export default function SettingsPage() {
    const { user } = useAuth();
    // const [settings, setSettings] = useState<Settings | null>(null); // Removed unused
    const [contractHours, setContractHours] = useState(40);
    const [vacationDays, setVacationDays] = useState(25);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

    // Export State
    const [exportStartDate, setExportStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [exportEndDate, setExportEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = (await settingsApi.getSettings()) as Settings | null;
            if (data) {
                // setSettings(data);
                setContractHours(data.contract_hours_per_week);
                setVacationDays(data.vacation_days_per_year);
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            const newSettings: NewSettings = {
                user_id: user.id,
                contract_hours_per_week: contractHours,
                vacation_days_per_year: vacationDays,
            };

            await settingsApi.upsertSettings(newSettings);
            alert('Settings saved!');
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleExportJournal = async () => {
        if (!user) return;
        setIsExporting(true);
        try {
            // 1. Fetch entries
            const entries = await journalApi.getEntries(exportStartDate, exportEndDate) || [];

            if (entries.length === 0) {
                alert('No journal entries found for this period.');
                return;
            }

            // 2. Generate PDF
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text('Journal Export', 14, 22);
            doc.setFontSize(10);
            doc.text(`Period: ${exportStartDate} to ${exportEndDate}`, 14, 30);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

            // Table
            const tableData = entries.map((entry: JournalEntry) => [
                format(new Date(entry.date), 'dd-MM-yyyy'),
                entry.title,
                entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
                entry.tags?.join(', ') || ''
            ]);

            autoTable(doc, {
                head: [['Date', 'Title', 'Content Preview', 'Tags']],
                body: tableData,
                startY: 40,
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 25 }
                }
            });

            // Save
            doc.save(`journal_export_${exportStartDate}_${exportEndDate}.pdf`);

        } catch (error) {
            console.error('Failed to export PDF', error);
            alert('Failed to generate PDF');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <SettingsIcon className="h-8 w-8" /> Settings
            </h1>

            {/* General Configuration */}
            <section className="bg-card p-6 rounded-lg border border-border space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Save className="h-5 w-5" /> Work & Vacation Configuration
                </h2>
                <form onSubmit={handleSaveSettings} className="grid gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium mb-1">Contract Hours per Week</label>
                        <input
                            type="number"
                            value={contractHours}
                            onChange={e => setContractHours(parseFloat(e.target.value))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            min="0" step="0.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Used to calculate overtime balance.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Vacation Days per Year</label>
                        <input
                            type="number"
                            value={vacationDays}
                            onChange={e => setVacationDays(parseFloat(e.target.value))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            min="0" step="0.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Total allowance for the year.</p>
                    </div>
                    <div className="md:col-span-2 flex justify-between items-center pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setIsTagManagerOpen(true)}
                            className="flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
                        >
                            <TagIcon className="h-4 w-4" />
                            Manage Labels
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </section>

            {/* Data Export */}
            <section className="bg-card p-6 rounded-lg border border-border space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Reporting & Export
                </h2>

                <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="font-medium text-lg">Journal Export (PDF)</h3>
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input
                                type="date"
                                value={exportStartDate}
                                onChange={e => setExportStartDate(e.target.value)}
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                                type="date"
                                value={exportEndDate}
                                onChange={e => setExportEndDate(e.target.value)}
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <button
                            onClick={handleExportJournal}
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium hover:bg-secondary/80 disabled:opacity-50"
                        >
                            {isExporting ? (
                                'Generating...'
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" /> Export to PDF
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Generates a PDF overview of all journal entries within the selected date range.
                    </p>
                </div>
            </section>

            <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} />
        </div>
    );
}
