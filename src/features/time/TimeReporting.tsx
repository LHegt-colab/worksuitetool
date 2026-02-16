import { useState, useEffect } from 'react';
import { timeApi, type TimeEntry } from './api';
import { type Settings } from '../settings/api';
import { X, TrendingUp, Sun, Calendar, Clock } from 'lucide-react';
import { eachDayOfInterval, isWeekend, startOfYear, endOfYear, isFuture, parseISO } from 'date-fns';

interface TimeReportingProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings | null;
}

export function TimeReporting({ isOpen, onClose, settings }: TimeReportingProps) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(false);

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

    if (!isOpen) return null;

    // --- Calculations ---

    // 1. Contract & Business Days (Up to Today for Overtime)
    const contractHoursPerWeek = settings?.contract_hours_per_week || 40;
    const hoursPerDay = contractHoursPerWeek / 5;
    const vacationAllowanceDays = settings?.vacation_days_per_year || 25;

    const today = new Date();
    const startOfCurrentYear = startOfYear(new Date(year, 0, 1));
    // End of calculation period for "Worked vs Expected": 
    // If year is past, use end of year. If current year, use today.
    const calculationEnd = year < today.getFullYear() ? endOfYear(new Date(year, 0, 1)) : today;

    // A. Expected Hours (YTD)
    let businessDaysYTD = 0;
    try {
        const days = eachDayOfInterval({ start: startOfCurrentYear, end: calculationEnd });
        businessDaysYTD = days.filter(d => !isWeekend(d)).length;
    } catch (e) { /* ignore */ }
    const expectedHoursYTD = businessDaysYTD * hoursPerDay;

    // B. Worked Hours (YTD) - Only count past/today work entries
    const workEntries = entries.filter(e => (e.type === 'work' || !e.type) && !isFuture(parseISO(e.date)));
    const totalMinutesWorkedYTD = workEntries.reduce((acc, e) => acc + e.duration, 0);
    const totalHoursWorkedYTD = totalMinutesWorkedYTD / 60;

    // C. Overtime Balance (Cumulative YTD)
    // We must also account for "Balance" adjustments (type='balance')
    // And subtract "Vacation" taken YTD from "Expected"? 
    // Usually: Expected = Business Days * 8. 
    // If I take vacation, I work 0, but I get paid 8. 
    // So Vacation entries should COUNT towards "Worked" for overtime calculation? 
    // OR: Vacation reduces "Expected"?
    // Standard approach: Vacation counts as "Time Credited".

    const vacationEntriesYTD = entries.filter(e => e.type === 'vacation' && !isFuture(parseISO(e.date)));
    const sickEntriesYTD = entries.filter(e => e.type === 'sick' && !isFuture(parseISO(e.date)));

    // Convert duration to hours
    const vacationHoursYTD = vacationEntriesYTD.reduce((acc, e) => acc + e.duration, 0) / 60;
    const sickHoursYTD = sickEntriesYTD.reduce((acc, e) => acc + e.duration, 0) / 60;

    // Balance corrections (manual adjustments)
    const balanceEntries = entries.filter(e => e.type === 'balance');
    const balanceAdjustmentHours = balanceEntries.reduce((acc, e) => acc + e.duration, 0) / 60;

    // Total Credited Hours = Worked + Vacation + Sick + Adjustments
    const totalCreditedHoursYTD = totalHoursWorkedYTD + vacationHoursYTD + sickHoursYTD + balanceAdjustmentHours;

    const overtimeBalance = totalCreditedHoursYTD - expectedHoursYTD;


    // 2. Vacation Planning (Whole Year)
    const allVacationEntries = entries.filter(e => e.type === 'vacation');
    const totalVacationMinutes = allVacationEntries.reduce((acc, e) => acc + e.duration, 0);
    const totalVacationDaysUsed = totalVacationMinutes / 60 / hoursPerDay; // Assuming standard day length for deduction

    const remainingVacationDays = vacationAllowanceDays - totalVacationDaysUsed;

    const futureVacation = allVacationEntries.filter(e => isFuture(parseISO(e.date))).sort((a, b) => a.date.localeCompare(b.date));


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl rounded-lg bg-card p-6 shadow-xl ring-1 ring-border max-h-[90vh] overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" /> Yearly Report & Planning ({year})
                    </h2>
                    <div className="flex items-center gap-4">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="rounded-md border border-input bg-background px-3 py-1 text-sm font-medium"
                        >
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">Loading Report...</div>
                ) : (
                    <div className="space-y-8">
                        {/* KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Overtime */}
                            <div className={`p-4 rounded-lg border shadow-sm ${overtimeBalance < 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-green-50 dark:bg-green-950/20 border-green-200'}`}>
                                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Overtime Balance (YTD)
                                </h3>
                                <div className={`text-3xl font-bold mt-2 ${overtimeBalance < 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                    {overtimeBalance > 0 ? '+' : ''}{overtimeBalance.toFixed(1)} <span className="text-sm font-normal">hours</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Worked: {totalCreditedHoursYTD.toFixed(1)}h | Expected: {expectedHoursYTD.toFixed(1)}h
                                </p>
                            </div>

                            {/* Vacation Balance */}
                            <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Sun className="h-4 w-4" /> Remaining Vacation
                                </h3>
                                <div className="text-3xl font-bold text-foreground mt-2">
                                    {remainingVacationDays.toFixed(1)} <span className="text-sm font-normal">days</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Allowance: {vacationAllowanceDays} | Used + Planned: {totalVacationDaysUsed.toFixed(1)}
                                </p>
                            </div>

                            {/* Contract Stats */}
                            <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Work Stats
                                </h3>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Contract:</span>
                                        <span className="font-medium">{contractHoursPerWeek}h / week</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Actual Worked (YTD):</span>
                                        <span className="font-medium">{totalHoursWorkedYTD.toFixed(1)}h</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Sick Leave (YTD):</span>
                                        <span className="font-medium">{sickHoursYTD.toFixed(1)}h</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vacation Planning List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b border-border pb-2">Vacation Planning (Future)</h3>
                            {futureVacation.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No upcoming vacation planned.</p>
                            ) : (
                                <div className="grid gap-2">
                                    {futureVacation.map(vacation => (
                                        <div key={vacation.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-md">
                                            <div className="flex items-center gap-4">
                                                <div className="font-medium text-orange-900 dark:text-orange-200">
                                                    {new Date(vacation.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{vacation.description || 'Vacation'}</div>
                                            </div>
                                            <div className="text-sm font-bold text-orange-700 dark:text-orange-400">
                                                {(vacation.duration / 60 / hoursPerDay).toFixed(1)} days
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                            * Calculation assumes {hoursPerDay} hours per standard work day based on contract settings. Overtime is calculated up to today.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
