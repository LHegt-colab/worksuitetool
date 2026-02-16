import { useEffect, useState } from 'react';
import { timeApi } from '../lib/api/time';
import type { WorkEntry, UpsertWorkEntryDTO, VacationTransaction, CreateVacationTransactionDTO } from '../types';
import { Clock, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TimeManagement() {
    const [activeTab, setActiveTab] = useState<'timesheet' | 'vacation'>('timesheet');

    // Timesheet State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
    const [weekDates, setWeekDates] = useState<Date[]>([]);
    const [loadingTimesheet, setLoadingTimesheet] = useState(false);
    const [savingEntry, setSavingEntry] = useState<string | null>(null);
    const [overtimeBalance, setOvertimeBalance] = useState<number>(0);
    const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
    const [adjustment, setAdjustment] = useState({ minutes: 0, reason: '' });

    // Vacation State
    const [vacationTransactions, setVacationTransactions] = useState<VacationTransaction[]>([]);
    const [vacationBalance, setVacationBalance] = useState({ granted: 0, purchased: 0, used: 0, total: 0 });
    // const [loadingVacation, setLoadingVacation] = useState(false); // Removed unused
    const [showVacationForm, setShowVacationForm] = useState(false);
    const [newTransaction, setNewTransaction] = useState<Partial<CreateVacationTransactionDTO>>({
        type: 'Usage',
        hours: 8,
        date: new Date().toISOString().slice(0, 10)
    });

    useEffect(() => {
        if (activeTab === 'timesheet') {
            loadTimesheet();
            loadOvertimeBalance();
        } else {
            loadVacation();
        }
    }, [activeTab, currentDate]);

    // --- Timesheet Logic ---

    const loadTimesheet = async () => {
        setLoadingTimesheet(true);
        try {
            // Calculate week range (Mon-Sun)
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay() || 7; // Make Sunday 7
            if (day !== 1) startOfWeek.setHours(-24 * (day - 1));

            const dates = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(startOfWeek);
                d.setDate(d.getDate() + i);
                return d;
            });
            setWeekDates(dates);

            const startStr = dates[0].toISOString().slice(0, 10);
            const endStr = dates[6].toISOString().slice(0, 10);

            const entries = await timeApi.fetchWorkEntries(startStr, endStr);
            setWorkEntries(entries);
        } catch (error) {
            console.error('Failed to load timesheet', error);
        } finally {
            setLoadingTimesheet(false);
        }
    };

    const handleSaveEntry = async (date: Date, entryData: Partial<WorkEntry>) => {
        const dateStr = date.toISOString().slice(0, 10);
        setSavingEntry(dateStr);
        try {
            const payload: UpsertWorkEntryDTO = {
                date: dateStr,
                start_time: entryData.start_time || undefined,
                end_time: entryData.end_time || undefined,
                break_minutes: entryData.break_minutes || 30, // Default 30
                notes: entryData.notes
            };
            await timeApi.upsertWorkEntry(payload);
            loadTimesheet(); // Refresh to ensure correct state
        } catch (error) {
            console.error('Failed to save entry', error);
        } finally {
            setSavingEntry(null);
        }
    };

    const loadOvertimeBalance = async () => {
        try {
            const balance = await timeApi.getOvertimeBalance();
            setOvertimeBalance(balance || 0);
        } catch (error) {
            console.error('Failed to load overtime balance', error);
        }
    };

    const handleSaveAdjustment = async () => {
        if (!adjustment.minutes) return;
        try {
            await timeApi.createOvertimeAdjustment({
                date: new Date().toISOString().slice(0, 10),
                minutes: adjustment.minutes,
                reason: adjustment.reason
            });
            setShowAdjustmentForm(false);
            setAdjustment({ minutes: 0, reason: '' });
            loadOvertimeBalance();
        } catch (error) {
            console.error('Failed to save adjustment', error);
        }
    };

    const changeWeek = (weeks: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (weeks * 7));
        setCurrentDate(newDate);
    };

    const calculateDailyHours = (start?: string, end?: string, breakMins: number = 0) => {
        if (!start || !end) return 0;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        const diff = endMins - startMins - breakMins;
        return diff > 0 ? diff / 60 : 0;
    };

    const calculateOvertime = (hours: number) => {
        return hours - 8; // Standard 8h day
    };

    // --- Vacation Logic ---

    const loadVacation = async () => {
        setLoadingVacation(true);
        try {
            const transactions = await timeApi.fetchVacationTransactions();
            setVacationTransactions(transactions);

            // Calculate Balance
            const granted = transactions.filter(t => t.type === 'Grant').reduce((acc, t) => acc + Number(t.hours), 0);
            const purchased = transactions.filter(t => t.type === 'Purchase').reduce((acc, t) => acc + Number(t.hours), 0);
            const used = transactions.filter(t => t.type === 'Usage').reduce((acc, t) => acc + Math.abs(Number(t.hours)), 0);
            const adjustments = transactions.filter(t => t.type === 'Adjustment').reduce((acc, t) => acc + Number(t.hours), 0);

            setVacationBalance({
                granted,
                purchased,
                used,
                total: granted + purchased + adjustments - used
            });
        } catch (error) {
            console.error('Failed to load vacation data', error);
        } finally {
            setLoadingVacation(false);
        }
    };

    const handleAddTransaction = async () => {
        if (!newTransaction.type || !newTransaction.hours || !newTransaction.date) return;
        try {
            // If Usage, make hours negative ensures consistency, 
            // but UI might show positive input. Let's handle logic here.
            let hours = Number(newTransaction.hours);
            if (newTransaction.type === 'Usage' && hours > 0) hours = -hours;

            await timeApi.createVacationTransaction({
                date: newTransaction.date,
                type: newTransaction.type,
                hours: hours,
                notes: newTransaction.notes
            } as CreateVacationTransactionDTO);

            setShowVacationForm(false);
            setNewTransaction({ type: 'Usage', hours: 8, date: new Date().toISOString().slice(0, 10) });
            loadVacation();
        } catch (error) {
            console.error('Failed to add transaction', error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                <Clock className="h-8 w-8" />
                Time Management
            </h1>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab('timesheet')}
                    className={`px-6 py-2 font-medium border-b-2 transition-colors ${activeTab === 'timesheet'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-muted hover:text-text'
                        }`}
                >
                    Timesheet
                </button>
                <button
                    onClick={() => setActiveTab('vacation')}
                    className={`px-6 py-2 font-medium border-b-2 transition-colors ${activeTab === 'vacation'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-muted hover:text-text'
                        }`}
                >
                    Vacation
                </button>
            </div>

            {/* Timesheet Content */}
            {activeTab === 'timesheet' && (
                <div className="space-y-6">
                    {/* Overtime Balance Card */}
                    <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-text-muted">Total Overtime Balance</h3>
                            <p className={`text-3xl font-bold ${overtimeBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {overtimeBalance > 0 ? '+' : ''}{Number(overtimeBalance).toFixed(2)}h
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
                            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
                        >
                            Manual Adjustment
                        </button>
                    </div>

                    {/* Adjustment Form */}
                    {showAdjustmentForm && (
                        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                            <h3 className="font-semibold">Add Overtime Adjustment</h3>
                            <div className="flex gap-4 items-end">
                                <div className="space-y-1">
                                    <label className="text-sm text-text-muted">Minutes (+/-)</label>
                                    <input
                                        type="number"
                                        className="block p-2 border border-border rounded-md bg-background"
                                        placeholder="e.g. 60 or -30"
                                        value={adjustment.minutes}
                                        onChange={e => setAdjustment({ ...adjustment, minutes: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <label className="text-sm text-text-muted">Reason</label>
                                    <input
                                        type="text"
                                        className="block w-full p-2 border border-border rounded-md bg-background"
                                        placeholder="e.g. Paid out, Correction"
                                        value={adjustment.reason}
                                        onChange={e => setAdjustment({ ...adjustment, reason: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={handleSaveAdjustment}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                        <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-muted rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Week of {weekDates[0]?.toLocaleDateString()}
                        </h2>
                        <button onClick={() => changeWeek(1)} className="p-2 hover:bg-muted rounded-full">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="p-4 font-medium text-text-muted">Date</th>
                                    <th className="p-4 font-medium text-text-muted">Start</th>
                                    <th className="p-4 font-medium text-text-muted">End</th>
                                    <th className="p-4 font-medium text-text-muted">Break (m)</th>
                                    <th className="p-4 font-medium text-text-muted">Hours</th>
                                    <th className="p-4 font-medium text-text-muted">Overtime</th>
                                    <th className="p-4 font-medium text-text-muted text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingTimesheet ? (
                                    <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                                ) : (
                                    weekDates.map(date => {
                                        const dateStr = date.toISOString().slice(0, 10);
                                        const entry = workEntries.find(e => e.date === dateStr) || { break_minutes: 30 };
                                        const totalHours = calculateDailyHours(entry.start_time, entry.end_time, entry.break_minutes);
                                        const overtime = calculateOvertime(totalHours);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                        return (
                                            <TimesheetRow
                                                key={dateStr}
                                                date={date}
                                                entry={entry}
                                                isWeekend={isWeekend}
                                                totalHours={totalHours}
                                                overtime={overtime}
                                                onSave={(data) => handleSaveEntry(date, data)}
                                                isSaving={savingEntry === dateStr}
                                            />
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Vacation Content */}
            {activeTab === 'vacation' && (
                <div className="space-y-6">
                    {/* Balance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <h3 className="text-green-800 text-sm font-medium">Total Granted</h3>
                            <p className="text-2xl font-bold text-green-900">{vacationBalance.granted}h</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h3 className="text-blue-800 text-sm font-medium">Purchased</h3>
                            <p className="text-2xl font-bold text-blue-900">{vacationBalance.purchased}h</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <h3 className="text-orange-800 text-sm font-medium">Used</h3>
                            <p className="text-2xl font-bold text-orange-900">{vacationBalance.used}h</p>
                        </div>
                        <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                            <h3 className="text-primary text-sm font-medium">Current Balance</h3>
                            <p className="text-2xl font-bold text-primary">{vacationBalance.total}h</p>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Transactions</h2>
                        <button
                            onClick={() => setShowVacationForm(!showVacationForm)}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Transaction
                        </button>
                    </div>

                    {/* Add Transaction Form */}
                    {showVacationForm && (
                        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4">
                            <h3 className="font-semibold">New Transaction</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <select
                                    className="p-2 border border-border rounded-md bg-background"
                                    value={newTransaction.type}
                                    onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value as any })}
                                >
                                    <option value="Usage">Usage (Take Leave)</option>
                                    <option value="Purchase">Purchase (Buy Hours)</option>
                                    <option value="Grant">Grant (Employer Gift)</option>
                                    <option value="Adjustment">Adjustment</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Hours (e.g. 8)"
                                    className="p-2 border border-border rounded-md bg-background"
                                    value={newTransaction.hours}
                                    onChange={e => setNewTransaction({ ...newTransaction, hours: Number(e.target.value) })}
                                />
                                <input
                                    type="date"
                                    className="p-2 border border-border rounded-md bg-background"
                                    value={newTransaction.date}
                                    onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                />
                                <button
                                    onClick={handleAddTransaction}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Transactions List */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="p-4 font-medium text-text-muted">Date</th>
                                    <th className="p-4 font-medium text-text-muted">Type</th>
                                    <th className="p-4 font-medium text-text-muted">Hours</th>
                                    <th className="p-4 font-medium text-text-muted">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vacationTransactions.map(t => (
                                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                        <td className="p-4">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${t.type === 'Usage' ? 'bg-orange-100 text-orange-800' :
                                                t.type === 'Grant' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className={`p-4 font-mono ${Number(t.hours) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            {Number(t.hours) > 0 ? '+' : ''}{t.hours}h
                                        </td>
                                        <td className="p-4 text-text-muted text-sm">{t.notes || '-'}</td>
                                    </tr>
                                ))}
                                {vacationTransactions.length === 0 && (
                                    <tr><td colSpan={4} className="p-4 text-center text-text-muted">No transactions found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component for Timesheet Row to handle local input state
function TimesheetRow({ date, entry, isWeekend, totalHours, overtime, onSave, isSaving }: any) {
    const [start, setStart] = useState(entry.start_time || '');
    const [end, setEnd] = useState(entry.end_time || '');
    const [breakMins, setBreakMins] = useState(entry.break_minutes || 30);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setStart(entry.start_time || '');
        setEnd(entry.end_time || '');
        setBreakMins(entry.break_minutes || 30);
        setIsDirty(false);
    }, [entry]);

    const handleBlur = () => {
        if (isDirty) {
            onSave({ start_time: start, end_time: end, break_minutes: breakMins });
        }
    };

    return (
        <tr className={`border-b border-border hover:bg-muted/30 ${isWeekend ? 'bg-secondary/30' : ''}`}>
            <td className="p-4">
                <div className="font-medium">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                <div className="text-xs text-text-muted">{date.toLocaleDateString()}</div>
            </td>
            <td className="p-4">
                <input
                    type="time"
                    value={start}
                    onChange={e => { setStart(e.target.value); setIsDirty(true); }}
                    onBlur={handleBlur}
                    className="p-1 border border-border rounded w-28 bg-transparent"
                />
            </td>
            <td className="p-4">
                <input
                    type="time"
                    value={end}
                    onChange={e => { setEnd(e.target.value); setIsDirty(true); }}
                    onBlur={handleBlur}
                    className="p-1 border border-border rounded w-28 bg-transparent"
                />
            </td>
            <td className="p-4">
                <input
                    type="number"
                    value={breakMins}
                    onChange={e => { setBreakMins(Number(e.target.value)); setIsDirty(true); }}
                    onBlur={handleBlur}
                    className="p-1 border border-border rounded w-16 bg-transparent"
                />
            </td>
            <td className="p-4 font-mono">{totalHours.toFixed(2)}h</td>
            <td className={`p-4 font-mono ${overtime > 0 ? 'text-green-600' : overtime < 0 ? 'text-red-500' : 'text-text-muted'}`}>
                {overtime > 0 ? '+' : ''}{overtime.toFixed(2)}h
            </td>
            <td className="p-4 text-right">
                {isSaving && <span className="text-xs text-primary animate-pulse">Saving...</span>}
            </td>
        </tr>
    );
}
