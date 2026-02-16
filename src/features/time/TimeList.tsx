import { useState, useEffect, useCallback } from 'react';
import { timeApi, type TimeEntry, type NewTimeEntry } from './api';
import { settingsApi, type Settings } from '../settings/api';
import { TimeForm } from './TimeForm';
import { TimeReporting } from './TimeReporting';
import { Plus, CheckSquare, Clock, Briefcase, Sun, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { actionsApi, type Action } from '../actions/api';
import { useAuth } from '../../contexts/AuthContext';
import { eachDayOfInterval, startOfMonth, endOfMonth, parseISO, isWeekend, format } from 'date-fns';

export function TimeList() {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>(undefined);
    const { user } = useAuth();

    // Default to current month
    const now = new Date();
    const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));

    const loadData = useCallback(async () => {
        setLoading(true);

        // Load Time Entries (Critical)
        try {
            const entriesData = await timeApi.getEntries(startDate, endDate);
            setEntries(entriesData || []);
        } catch (error) {
            console.error('Failed to load time entries:', error);
            // Don't alert here to avoid spamming, just log
        }

        // Load Actions (Non-critical)
        try {
            const actionsData = await actionsApi.getActions();
            setActions(actionsData || []);
        } catch (error) {
            console.error('Failed to load actions:', error);
        }

        // Load Settings (Non-critical)
        try {
            const settingsData = await settingsApi.getSettings();
            setSettings(settingsData);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }

        setLoading(false);
    }, [startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreate = async (data: NewTimeEntry) => {
        if (!user) return;
        try {
            await timeApi.createEntry({ ...data, user_id: user.id });
            alert('Time entry saved successfully.');
            loadData();
        } catch (e) {
            console.error(e);
            alert('Error saving entry.');
        }
    };

    const handleUpdate = async (data: NewTimeEntry) => {
        if (!editingEntry) return;
        try {
            await timeApi.updateEntry(editingEntry.id, data);
            alert('Time entry updated successfully.');
            loadData();
            setEditingEntry(undefined);
        } catch (e) {
            console.error(e);
            alert('Error updating entry.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            await timeApi.deleteEntry(id);
            loadData();
        }
    };

    const openEdit = (entry: TimeEntry) => {
        setEditingEntry(entry);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingEntry(undefined);
    };

    const getActionDetails = (id: string) => actions.find(a => a.id === id);

    // --- Calculations ---

    // 1. Worked Hours (Type = 'work')
    const workEntries = entries.filter(e => e.type === 'work' || !e.type); // Default to work if null
    const totalMinutesWorked = workEntries.reduce((acc, entry) => acc + entry.duration, 0);
    const totalHoursWorked = totalMinutesWorked / 60;

    // 2. Expected Hours (Contract)
    // Simple logic: Count business days in period * (contractHours / 5)
    // This is an approximation. A robust system would check holidays etc.
    const contractHours = settings?.contract_hours_per_week || 40;
    const hoursPerDay = contractHours / 5;

    let businessDays = 0;
    try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const days = eachDayOfInterval({ start, end });
        businessDays = days.filter(d => !isWeekend(d)).length;
    } catch (e) { /* ignore invalid dates during typing */ }

    const expectedHours = businessDays * hoursPerDay;
    const overtimeHours = totalHoursWorked - expectedHours;

    // 3. Vacation (Type = 'vacation')
    // Note: Vacation balance is usually 'per year'. 
    // We should probably fetch ALL entries for the current YEAR to calculate remaining balance, 
    // not just the selected month. But for this view, we might just show usage in period.
    // To show TRUE balance, simpler approach: just assume settings.vacation_days_per_year is the pool,
    // and subtract ALL vacation entries ever? Or current year?
    // Let's stick to "Vacation used in this period" and "Yearly Balance estimated" requires year fetch.
    // For now, let's just show "Vacation Used Period".
    const vacationEntries = entries.filter(e => e.type === 'vacation');
    const vacationHoursUsed = vacationEntries.reduce((acc, e) => acc + e.duration, 0) / 60;
    const vacationDaysUsed = vacationHoursUsed / 8; // Assuming 8h days for conversion

    // Group by Date
    const groupedEntries: Record<string, TimeEntry[]> = {};
    entries.forEach(entry => {
        if (!groupedEntries[entry.date]) {
            groupedEntries[entry.date] = [];
        }
        groupedEntries[entry.date].push(entry);
    });

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading time entries...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Time Management</h1>
                    {!settings && (
                        <p className="text-sm text-yellow-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            Configure Settings to enable proper calculations.
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => loadData()}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setIsReportOpen(true)}
                        className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium shadow hover:bg-secondary/80"
                    >
                        <TrendingUp className="mr-2 h-4 w-4" /> Yearly Overview
                    </button>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Log Time
                    </button>
                </div>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border shadow-sm w-fit">
                <span className="text-sm font-medium text-foreground">Period:</span>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-md border border-input px-3 py-2 text-sm"
                />
                <span className="text-muted-foreground">-</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-md border border-input px-3 py-2 text-sm"
                />
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-card p-4 rounded-lg border border-border shadow-sm space-y-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Worked (Total)
                    </span>
                    <div className="text-2xl font-bold text-foreground">
                        {totalHoursWorked.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">h</span>
                    </div>
                </div>

                <div className="bg-card p-4 rounded-lg border border-border shadow-sm space-y-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Expected (Contract)
                    </span>
                    <div className="text-2xl font-bold text-foreground">
                        {expectedHours.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">h</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Based on {contractHours}h week</div>
                </div>

                <div className={`bg-card p-4 rounded-lg border border-border shadow-sm space-y-2 ${overtimeHours < 0 ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' : 'border-green-200 bg-green-50/50 dark:bg-green-950/10'}`}>
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Overtime Balance
                    </span>
                    <div className={`text-2xl font-bold ${overtimeHours < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {overtimeHours > 0 ? '+' : ''}{overtimeHours.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">h</span>
                    </div>
                    <div className="text-xs text-muted-foreground">In selected period</div>
                </div>

                <div className="bg-card p-4 rounded-lg border border-border shadow-sm space-y-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Sun className="h-4 w-4" /> Vacation Used
                    </span>
                    <div className="text-2xl font-bold text-foreground">
                        {vacationDaysUsed.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">days</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Allowance: {settings?.vacation_days_per_year || '-'} days/year</div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a)).map(date => {
                    const dayEntries = groupedEntries[date];
                    const dayTotal = dayEntries.reduce((acc, e) => acc + e.duration, 0);

                    return (
                        <div key={date} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                            <div className="bg-muted/30 px-4 py-2 border-b border-border flex justify-between items-center">
                                <h3 className="font-medium text-foreground flex items-center gap-2">
                                    {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h3>
                                <span className="text-sm font-semibold text-primary">{(dayTotal / 60).toFixed(1)} h</span>
                            </div>
                            <div className="divide-y divide-border">
                                {dayEntries.map(entry => {
                                    const action = entry.action_id ? getActionDetails(entry.action_id) : null;
                                    const isWork = entry.type === 'work' || !entry.type;

                                    return (
                                        <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/5 transition-colors group">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-3">
                                                    {/* Badge */}
                                                    <span className={`
                                                        px-2 py-0.5 rounded text-xs font-medium border capitalize
                                                        ${entry.type === 'vacation' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
                                                        ${entry.type === 'sick' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                                                        ${entry.type === 'balance' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                                                        ${isWork ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                                                    `}>
                                                        {entry.type || 'Work'}
                                                    </span>

                                                    {/* Time Range */}
                                                    {entry.start_time && entry.end_time && (
                                                        <span className="font-mono text-sm text-foreground">
                                                            {entry.start_time} - {entry.end_time}
                                                        </span>
                                                    )}

                                                    {/* Duration */}
                                                    <span className="font-medium text-muted-foreground">
                                                        ({entry.duration} min)
                                                    </span>

                                                    {/* Break */}
                                                    {!!entry.break_duration && (
                                                        <span className="text-xs text-muted-foreground">
                                                            (Break: {entry.break_duration}m)
                                                        </span>
                                                    )}

                                                    {/* Action Tag */}
                                                    {action && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">
                                                            <CheckSquare className="h-3 w-3" /> {action.title}
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.description && (
                                                    <p className="text-sm text-muted-foreground pl-1">{entry.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(entry)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                                                <button onClick={() => handleDelete(entry.id)} className="text-xs font-medium text-destructive hover:underline">Delete</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <TimeForm
                isOpen={isFormOpen}
                initialData={editingEntry}
                onSubmit={editingEntry ? handleUpdate : handleCreate}
                onCancel={closeForm}
            />

            <TimeReporting
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                settings={settings}
            />
        </div>
    );
}
