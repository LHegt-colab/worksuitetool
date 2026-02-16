import { Link } from 'react-router-dom';
import { Clock, CheckSquare } from 'lucide-react';
import type { Meeting, Action, WorkEntry, VacationTransaction, Tag } from '../../types';
import { dateUtils } from '../../lib/dateUtils';

interface CalendarMonthProps {
    currentDate: Date;
    meetings: Meeting[];
    actions: Action[];
    workEntries: WorkEntry[];
    vacationDays: VacationTransaction[];
    tags: Tag[];
    onDayClick: (date: Date) => void;
}

export default function CalendarMonth({ currentDate, meetings, actions, workEntries, vacationDays, tags, onDayClick }: CalendarMonthProps) {
    const generateCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const start = new Date(firstDay);
        const dayOfWeek = start.getDay() || 7;
        if (dayOfWeek !== 1) start.setDate(start.getDate() - (dayOfWeek - 1));

        const end = new Date(lastDay);
        const endDayOfWeek = end.getDay() || 7;
        if (endDayOfWeek !== 7) end.setDate(end.getDate() + (7 - endDayOfWeek));

        const days: Date[] = [];
        const loop = new Date(start);
        while (loop <= end) {
            days.push(new Date(loop));
            loop.setDate(loop.getDate() + 1);
        }
        return days;
    };

    const calendarDays = generateCalendarGrid();

    const isToday = (date: Date) => {
        return dateUtils.isSameDay(date, new Date());
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const getDailyItems = (date: Date) => {
        const dateKey = dateUtils.toLocalDateKey(date);

        const daysMeetings = meetings.filter(m => dateUtils.isSameDay(m.date_time, date));
        const daysActions = actions.filter(a => dateUtils.isSameDay(a.due_date, date));
        const daysWork = workEntries.find(w => w.date === dateKey); // Work entries use YYYY-MM-DD
        const daysVacation = vacationDays.filter(v => v.date === dateKey && (v.type === 'Usage' || v.type === 'Grant'));

        return { meetings: daysMeetings, actions: daysActions, work: daysWork, vacation: daysVacation };
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Grid Header */}
            <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-t-lg overflow-hidden shrink-0">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="bg-muted/50 p-3 text-center font-medium text-text-muted text-sm">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 grid grid-cols-7 gap-px bg-border border-x border-b border-border rounded-b-lg overflow-hidden relative">
                {calendarDays.map((date, idx) => {
                    const { meetings, actions, work, vacation } = getDailyItems(date);

                    return (
                        <div
                            key={idx}
                            onClick={() => onDayClick(date)}
                            className={`min-h-[80px] bg-card p-1 flex flex-col gap-0.5 transition-colors hover:bg-muted/10 cursor-pointer
                                ${!isCurrentMonth(date) ? 'opacity-40 bg-muted/20' : ''}
                                ${isToday(date) ? 'bg-primary/5' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start p-1">
                                <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full 
                                    ${isToday(date) ? 'bg-primary text-primary-foreground' : 'text-text-muted'}
                                `}>
                                    {date.getDate()}
                                </span>
                                {work && (
                                    <span className="text-[10px] font-mono bg-secondary/20 text-secondary-foreground px-1 py-0.5 rounded flex items-center gap-0.5">
                                        <Clock className="h-2.5 w-2.5" />
                                        {((new Date(`1970-01-01T${work.end_time}`).getTime() - new Date(`1970-01-01T${work.start_time}`).getTime()) / 3600000 - (work.break_minutes / 60)).toFixed(1)}h
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar">
                                {/* Vacation */}
                                {vacation.map(v => (
                                    <div key={v.id} className="text-[10px] bg-orange-100 text-orange-800 px-1 rounded truncate">
                                        🌴 {v.type}
                                    </div>
                                ))}

                                {/* Meetings */}
                                {meetings.map(m => {
                                    const tag = m.tags?.[0] ? tags.find(t => t.name === m.tags?.[0]) : null;
                                    const color = tag?.color;
                                    const timeStr = dateUtils.formatTime(m.date_time);

                                    return (
                                        <Link
                                            to={`/meetings?id=${m.id}`}
                                            key={m.id}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-[10px] px-1 rounded truncate hover:opacity-80 block font-medium mb-0.5"
                                            style={{
                                                backgroundColor: color || '#dbeafe',
                                                color: color ? '#fff' : '#1e40af'
                                            }}
                                        >
                                            {timeStr} {m.title}
                                        </Link>
                                    );
                                })}

                                {/* Actions */}
                                {actions.map(a => {
                                    const tag = a.tags?.[0] ? tags.find(t => t.name === a.tags?.[0]) : null;
                                    const color = tag?.color;
                                    // Check if action has specific time to show
                                    let timePrefix = "";
                                    if (a.due_date && a.due_date.includes('T')) {
                                        const d = new Date(a.due_date);
                                        if (!(d.getHours() === 0 && d.getMinutes() === 0)) {
                                            timePrefix = dateUtils.formatTime(d) + " ";
                                        }
                                    }

                                    return (
                                        <Link
                                            to={`/actions?id=${a.id}`}
                                            key={a.id}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`text-[10px] px-1 rounded truncate hover:opacity-80 block border mb-0.5
                                                ${!color && (a.status === 'Done' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}
                                            `}
                                            style={color ? {
                                                backgroundColor: color,
                                                borderColor: color,
                                                color: '#fff'
                                            } : undefined}
                                        >
                                            <CheckSquare className="h-2.5 w-2.5 inline mr-0.5" />
                                            {timePrefix}<span className={a.status === 'Done' ? 'line-through' : ''}>{a.title}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
