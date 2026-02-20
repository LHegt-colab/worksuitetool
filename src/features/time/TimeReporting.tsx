import { useState, useEffect, useMemo } from 'react';
import { timeApi, type TimeEntry } from './api';
import { type Settings } from '../settings/api';
import { X, TrendingUp, Sun, Calendar, Clock, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
    eachDayOfInterval,
    isWeekend,
    startOfYear,
    endOfYear,
    isFuture,
    parseISO,
    startOfWeek,
    endOfWeek,
    format
} from 'date-fns';

interface TimeReportingProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings | null;
}

type Tab = 'overview' | 'daily' | 'vacation';

export function TimeReporting({ isOpen, onClose, settings }: TimeReportingProps) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Adjustment State
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadYearlyData();
        }
    }, [isOpen, year]);

    const loadYearlyData = async () => {
        setLoading(true);
        try {
            const data = await timeApi.getEntriesByYear(year);
            setEntries(data || []);
        } catch (error) {
            console.error('Failed to load yearly report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdjustment = async () => {
        if (!adjustmentAmount) return;
        const hours = parseFloat(adjustmentAmount);
        if (isNaN(hours)) return;

        try {
            // Create a balance entry
            // We use the start of the year (or current date if current year) for the record
            const date = year === new Date().getFullYear()
                ? format(new Date(), 'yyyy-MM-dd')
                : `${year}-01-01`;

            await timeApi.createEntry({
                user_id: settings?.user_id, // This might be undefined if settings partial, handled by API typically or context
                date: date,
                duration: hours * 60, // Store in minutes
                description: adjustmentReason || 'Manual Balance Adjustment',
                type: 'balance',
                break_duration: 0
            } as any);

            setAdjustmentAmount('');
            setAdjustmentReason('');
            setIsAdjustmentOpen(false);
            loadYearlyData();
        } catch (error) {
            console.error('Failed to create adjustment:', error);
        }
    };

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            await timeApi.deleteEntry(id);
            loadYearlyData();
        } catch (error) {
            console.error('Failed to delete entry:', error);
        }
    };

    // --- Calculations ---

    const {
        overtimeBalance,
        totalCreditedHoursYTD,
        expectedHoursYTD,
        remainingVacationDays,
        totalVacationDaysUsed,
        vacationAllowanceDays,
        hoursPerDay,
        contractHoursPerWeek,
        weeklyBalance,
        workedHoursThisWeek,
        expectedHoursThisWeek
    } = useMemo(() => {
        const contractHoursPerWeek = settings?.contract_hours_per_week || 40;
        const hoursPerDay = contractHoursPerWeek / 5;
        const vacationAllowanceDays = settings?.vacation_days_per_year || 25;

        const today = new Date();
        const startOfCurrentYear = startOfYear(new Date(year, 0, 1));

        // Calculation End Date:
        // For accurate "Overtime", we should only calculate expectation UP TO TODAY (inclusive) if in current year.
        // If viewing past year, end of year.
        // If viewing future year, expectation is 0 (or strictly 0 until date reached).
        let calculationEnd = year < today.getFullYear() ? endOfYear(new Date(year, 0, 1)) : today;
        if (year > today.getFullYear()) calculationEnd = startOfCurrentYear; // Future: 0 expectation

        // 1. Business Days YTD (Expected)
        let businessDaysYTD = 0;
        try {
            if (year <= today.getFullYear()) {
                const days = eachDayOfInterval({ start: startOfCurrentYear, end: calculationEnd });
                businessDaysYTD = days.filter(d => !isWeekend(d)).length;
            }
        } catch (e) { /* ignore invalid interval */ }

        const expectedHoursYTD = businessDaysYTD * hoursPerDay;

        // 2. Credited Hours YTD
        // Filter entries used for Overtime Calculation
        // - Work: Counted
        // - Vacation: Counted (as 8h usually, or duration stored)
        // - Sick: Counted
        // - Balance: Added directly
        // IGNORE future entries for Overtime Calculation to avoid "banking" future work

        const pastOrTodayEntries = entries.filter(e => {
            if (e.type === 'balance') return true; // Balance adjustments always count
            return !isFuture(parseISO(e.date));
        });

        const totalMinutesCredited = pastOrTodayEntries.reduce((acc, e) => {
            // If it's a balance entry, it can be negative, so we add.
            return acc + (e.duration || 0);
        }, 0);

        const totalCreditedHoursYTD = totalMinutesCredited / 60;
        const overtimeBalance = totalCreditedHoursYTD - expectedHoursYTD;


        // 3. Weekly Stats (Current Week)
        // Ensure we are looking at the *actual* current week if we are in the current year
        const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
        const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

        // Expected this week
        let businessDaysThisWeek = 0;
        try {
            // Calculate expectation up to TODAY for current week progress
            const endCalc = today > endOfThisWeek ? endOfThisWeek : today;
            const daysThisWeek = eachDayOfInterval({
                start: startOfThisWeek,
                end: endCalc
            });
            businessDaysThisWeek = daysThisWeek.filter(d => !isWeekend(d)).length;
        } catch (e) {/* ignore */ }

        const expectedHoursThisWeek = businessDaysThisWeek * hoursPerDay;

        const workThisWeek = entries.filter(e => {
            const d = parseISO(e.date);
            return d >= startOfThisWeek && d <= endOfThisWeek && !isFuture(d);
        });

        const workedHoursThisWeek = workThisWeek.reduce((acc, e) => acc + (e.duration || 0), 0) / 60;
        const weeklyBalance = workedHoursThisWeek - expectedHoursThisWeek;


        // 4. Vacation Stats (Whole Year)
        // Vacation Days Used = Sum of all vacation entries (past and future)
        const allVacationEntries = entries.filter(e => e.type === 'vacation');
        const totalVacationMinutes = allVacationEntries.reduce((acc, e) => acc + e.duration, 0);
        const totalVacationDaysUsed = totalVacationMinutes / 60 / hoursPerDay;

        const remainingVacationDays = vacationAllowanceDays - totalVacationDaysUsed;


        return {
            overtimeBalance,
            totalCreditedHoursYTD,
            expectedHoursYTD,
            remainingVacationDays,
            totalVacationDaysUsed,
            vacationAllowanceDays,
            hoursPerDay,
            contractHoursPerWeek,
            weeklyBalance,
            workedHoursThisWeek,
            expectedHoursThisWeek
        };

    }, [entries, year, settings]);

    if (!isOpen) return null;

    // Generate year range: Current Year - 5 to Current Year + 5 (or more)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - 4 + i); // 2022 to 2036 approx

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-5xl rounded-lg bg-card p-6 shadow-xl ring-1 ring-border max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" /> Time Management ({year})
                    </h2>
                    <div className="flex items-center gap-4">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="rounded-md border border-input bg-background px-3 py-1 text-sm font-medium"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Tags Navigation */}
                <div className="flex items-center border-b border-border mb-6 shrink-0 overflow-x-auto">
                    {(['overview', 'daily', 'vacation'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                ${activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                }
                            `}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading Report...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {/* 1. Overtime Balance (YTD) */}
                                    <div className={`p-4 rounded-lg border shadow-sm ${overtimeBalance < 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-green-50 dark:bg-green-950/20 border-green-200'}`}>
                                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" /> Overtime (YTD)
                                        </h3>
                                        <div className={`text-3xl font-bold mt-2 ${overtimeBalance < 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                            {overtimeBalance > 0 ? '+' : ''}{overtimeBalance.toFixed(1)} h
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Credited: {totalCreditedHoursYTD.toFixed(1)}h | Expected: {expectedHoursYTD.toFixed(1)}h
                                        </p>
                                    </div>

                                    {/* 2. Current Week Balance */}
                                    <div className={`p-4 rounded-lg border shadow-sm ${weeklyBalance < 0 ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200'}`}>
                                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4" /> This Week
                                        </h3>
                                        <div className={`text-3xl font-bold mt-2 ${weeklyBalance < 0 ? 'text-orange-700 dark:text-orange-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                            {weeklyBalance > 0 ? '+' : ''}{weeklyBalance.toFixed(1)} h
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Worked: {workedHoursThisWeek.toFixed(1)}h | Expected: {expectedHoursThisWeek.toFixed(1)}h
                                        </p>
                                    </div>

                                    {/* 3. Vacation */}
                                    <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Sun className="h-4 w-4" /> Vacation Days
                                        </h3>
                                        <div className="text-3xl font-bold text-foreground mt-2">
                                            {remainingVacationDays.toFixed(1)} d
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Used/Planned: {totalVacationDaysUsed.toFixed(1)} of {vacationAllowanceDays}
                                        </p>
                                    </div>

                                    {/* 4. Contract */}
                                    <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" /> Contract
                                        </h3>
                                        <div className="text-3xl font-bold text-foreground mt-2">
                                            {contractHoursPerWeek} h
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Per Week ({hoursPerDay}h / day)
                                        </p>
                                    </div>
                                </div>

                                {/* Manual Adjustments Section */}
                                <div className="border-t border-border pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Manual Balance Adjustments</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Add manual adjustments to correct your overtime balance (e.g., usually for previous years carried over).
                                        Positive values add to your balance, negative values subtract.
                                    </p>

                                    {!isAdjustmentOpen ? (
                                        <button
                                            onClick={() => setIsAdjustmentOpen(true)}
                                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
                                        >
                                            + Add Adjustment
                                        </button>
                                    ) : (
                                        <div className="bg-muted/30 p-4 rounded-lg border border-border max-w-lg">
                                            <div className="grid gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Hours (+/-)</label>
                                                    <input
                                                        type="number"
                                                        value={adjustmentAmount}
                                                        onChange={e => setAdjustmentAmount(e.target.value)}
                                                        placeholder="e.g. 10 or -5"
                                                        className="w-full rounded-md border border-input px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Reason</label>
                                                    <input
                                                        type="text"
                                                        value={adjustmentReason}
                                                        onChange={e => setAdjustmentReason(e.target.value)}
                                                        placeholder="e.g. Carry over from 2025"
                                                        className="w-full rounded-md border border-input px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setIsAdjustmentOpen(false)}
                                                        className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleCreateAdjustment}
                                                        className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90"
                                                    >
                                                        Save Adjustment
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-2">
                                        {entries.filter(e => e.type === 'balance').map(entry => (
                                            <div key={entry.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-md text-sm">
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono font-medium text-foreground">
                                                        {entry.duration > 0 ? '+' : ''}{(entry.duration / 60).toFixed(2)} h
                                                    </span>
                                                    <span className="text-muted-foreground">{entry.description}</span>
                                                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {entry.date}
                                                    </span>
                                                </div>
                                                <button onClick={() => handleDeleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DAILY LOG TAB */}
                        {activeTab === 'daily' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Daily Work Log (YTD)</h3>
                                <div className="rounded-md border border-border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr className="border-b border-border">
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {entries
                                                .filter(e => e.type === 'work' || !e.type) // Show standard work entries
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map(entry => (
                                                    <tr key={entry.id} className="hover:bg-muted/10 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                            {format(parseISO(entry.date), 'EEE, MMM d')}
                                                        </td>
                                                        <td className="px-4 py-3 text-foreground">
                                                            {(entry.duration / 60).toFixed(2)} h
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center rounded-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                                                Work
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground max-w-md truncate">
                                                            {entry.description || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleDeleteEntry(entry.id)}
                                                                className="text-muted-foreground hover:text-destructive p-1"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            {entries.filter(e => e.type === 'work' || !e.type).length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                        No work entries found for this year.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* VACATION TAB */}
                        {activeTab === 'vacation' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">Vacation Overview</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Track your taken vacation days and purchase additional hours.
                                        </p>
                                    </div>
                                    <div className="bg-card px-4 py-2 rounded-lg border border-border shadow-sm">
                                        <div className="text-sm text-muted-foreground">Remaining Allowance</div>
                                        <div className="text-2xl font-bold text-foreground">
                                            {remainingVacationDays.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">days</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* List of Vacation Taken */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" /> Vacation History & Plan
                                        </h4>
                                        <div className="rounded-md border border-border overflow-hidden">
                                            <div className="max-h-[400px] overflow-y-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50 sticky top-0">
                                                        <tr className="border-b border-border">
                                                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                                                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Days</th>
                                                            <th className="px-4 py-2 text-right font-medium text-muted-foreground"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {entries
                                                            .filter(e => e.type === 'vacation')
                                                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                            .map(entry => (
                                                                <tr key={entry.id} className="hover:bg-muted/10">
                                                                    <td className="px-4 py-2">
                                                                        <div className="font-medium">{format(parseISO(entry.date), 'yyyy-MM-dd')}</div>
                                                                        <div className="text-xs text-muted-foreground">{entry.description}</div>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-foreground">
                                                                        {(entry.duration / 60 / hoursPerDay).toFixed(1)} d
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <button onClick={() => handleDeleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive">
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purchase / Manual Add */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-foreground flex items-center gap-2">
                                            <Plus className="h-4 w-4" /> Add Extra Vacation Hours
                                        </h4>
                                        <div className="p-4 rounded-lg border border-border bg-card">
                                            <p className="text-xs text-muted-foreground mb-4">
                                                If you purchased extra vacation hours, add them here. They will increase your available manual balance adjustment, specific to vacation logic if needed,
                                                but for now we will add them as negative usage (credit) or a balance adjustment in the main overtime calculation.
                                                <br /><br />
                                                <span className="font-semibold text-orange-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Note: To increase "Remaining Vacation Days", we currently use a Balance Adjustment that reflects in the Overtime.
                                                </span>
                                            </p>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Hours Purchased</label>
                                                    <input
                                                        type="number"
                                                        id="vacation-buy-amount"
                                                        placeholder="e.g. 8"
                                                        className="w-full rounded-md border border-input px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        const el = document.getElementById('vacation-buy-amount') as HTMLInputElement;
                                                        const val = parseFloat(el.value);
                                                        if (!val || isNaN(val)) return;

                                                        // Add negative vacation entry
                                                        await timeApi.createEntry({
                                                            user_id: settings?.user_id,
                                                            date: format(new Date(), 'yyyy-MM-dd'),
                                                            duration: -(val * 60), // Negative duration = Credit
                                                            type: 'vacation',
                                                            description: 'Purchased Vacation Hours',
                                                            break_duration: 0
                                                        } as any);

                                                        el.value = '';
                                                        loadYearlyData();
                                                    }}
                                                    className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90"
                                                >
                                                    Add Purchased Hours
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
