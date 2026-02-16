
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { settingsApi, type Settings, type NewSettings } from '../features/settings/api';
import { journalApi, type JournalEntry } from '../features/journal/api';
import { supabase } from '../lib/supabase';
// import { decisionsApi } from '../features/decisions/api'; // Decisions usually fetched via meetings, but let's see if we can fetch all.
import { TagManager } from '../features/tags/TagManager';
import { Save, FileText, Settings as SettingsIcon, Tag as TagIcon, Download, Database, Upload } from 'lucide-react';
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
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

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



    const handleExportBackup = async () => {
        if (!user) return;
        setIsBackingUp(true);
        try {
            const tables = ['settings', 'actions', 'meetings', 'journal_entries', 'tags', 'time_entries', 'knowledge_pages', 'decisions'];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const promises = tables.map(table => supabase.from(table as any).select('*').eq('user_id', user.id));

            const results = await Promise.all(promises);

            const errors = results.map((r, index) => r.error ? { table: tables[index], error: r.error } : null).filter(Boolean);

            if (errors.length > 0) {
                console.error('Backup errors:', errors);
                alert(`Backup failed for tables: ${errors.map(e => e?.table).join(', ')}. Check console for details.`);
                throw new Error('Backup incomplete');
            }

            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                user_id: user.id,
                data: {
                    settings: results[0].data,
                    actions: results[1].data,
                    meetings: results[2].data,
                    journal_entries: results[3].data,
                    tags: results[4].data,
                    time_entries: results[5].data,
                    knowledge_pages: results[6].data,
                    decisions: results[7].data
                }
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `worksuitetool_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Backup failed:', error);
            // alert handled above for specific errors, or generic for others
            if ((error as Error).message !== 'Backup incomplete') {
                alert('Failed to generate backup: ' + (error as Error).message);
            }
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (!confirm('CAUTION: This will restore data from the backup. Existing records with the same ID will be updated. New records will be created. \n\nAre you sure you want to proceed?')) {
            event.target.value = ''; // reset
            return;
        }

        setIsRestoring(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (!json.data || !json.version) throw new Error('Invalid backup file format');

                const { data } = json;

                // Restore in dependency order
                const steps = [
                    { table: 'settings', data: data.settings },
                    { table: 'tags', data: data.tags },
                    { table: 'knowledge_pages', data: data.knowledge_pages },
                    { table: 'meetings', data: data.meetings },
                    { table: 'actions', data: data.actions },
                    { table: 'journal_entries', data: data.journal_entries },
                    { table: 'time_entries', data: data.time_entries },
                    { table: 'decisions', data: data.decisions }
                ];

                for (const step of steps) {
                    if (step.data && step.data.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { error } = await supabase.from(step.table as any).upsert(step.data);
                        if (error) throw new Error(`Failed to restore ${step.table}: ${error.message}`);
                    }
                }

                alert('Backup restored successfully! The page will now reload.');
                window.location.reload();

            } catch (error) {
                console.error('Restore failed:', error);
                alert('Restore failed: ' + (error as Error).message);
            } finally {
                setIsRestoring(false);
                event.target.value = '';
            }
        };

        reader.readAsText(file);
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
            doc.text(`Period: ${exportStartDate} to ${exportEndDate} `, 14, 30);
            doc.text(`Generated: ${new Date().toLocaleString()} `, 14, 35);

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

            {/* Data Management */}
            <section className="bg-card p-6 rounded-lg border border-border space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5" /> Data Management
                </h2>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-4">
                    <div>
                        <h3 className="font-medium text-lg">Full JSON Backup</h3>
                        <p className="text-sm text-muted-foreground">
                            Download a complete copy of all your data (Settings, Actions, Meetings, Journal, Time, etc.) as a JSON file.
                        </p>
                    </div>
                    <button
                        onClick={handleExportBackup}
                        disabled={isBackingUp}
                        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium hover:bg-secondary/80 disabled:opacity-50"
                    >
                        {isBackingUp ? (
                            'Exporting...'
                        ) : (
                            <>
                                <Download className="h-4 w-4" /> Download Backup
                            </>
                        )}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-4">
                    <div>
                        <h3 className="font-medium text-lg">Restore Data</h3>
                        <p className="text-sm text-muted-foreground">
                            Upload a previously exported JSON backup file to restore your data.
                            <br />
                            <span className="text-amber-500 font-bold">Warning: This will overwrite existing records with matching IDs.</span>
                        </p>
                    </div>
                    <label className={`flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-medium cursor-pointer hover:bg-destructive/90 ${isRestoring ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isRestoring ? (
                            'Restoring...'
                        ) : (
                            <>
                                <Upload className="h-4 w-4" /> Upload Backup
                            </>
                        )}
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImportBackup}
                            disabled={isRestoring}
                        />
                    </label>
                </div>
            </section>

            <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} />
        </div>
    );
}
