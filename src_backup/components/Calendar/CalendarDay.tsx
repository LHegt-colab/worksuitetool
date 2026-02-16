import { Link } from 'react-router-dom';
import { Clock, CheckSquare } from 'lucide-react';
import type { Meeting, Action, WorkEntry, VacationTransaction, Tag } from '../../types';
import { dateUtils } from '../../lib/dateUtils';

interface CalendarDayProps {
    currentDate: Date;
    meetings: Meeting[];
    actions: Action[];
    workEntries: WorkEntry[];
    vacationDays: VacationTransaction[];
    tags: Tag[];
    onTimeSlotClick: (date: Date, time: string) => void;
}

export default function CalendarDay({ currentDate, meetings, actions, workEntries, vacationDays, tags, onTimeSlotClick }: CalendarDayProps) {
    const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 06:00 to 20:00
    const currentLocaDateKey = dateUtils.toLocalDateKey(currentDate);

    // Filter Items for Today
    const dayMeetings = meetings.filter(m => dateUtils.isSameDay(m.date_time, currentDate));
    const dayWork = workEntries.find(w => w.date === currentLocaDateKey);
    const dayVacation = vacationDays.filter(v => v.date === currentLocaDateKey);

    // Filter Actions: Include spanning actions and overdue actions
    const dayActions = actions.filter(a => {
        // Must have at least one date
        if (!a.start_date && !a.due_date) return false;

        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Determine effective start/end
        // If start_date is missing, assume it starts at due_date (point in time) or earlier? 
        // Logic: if only due_date, treat as deadline.
        // If only start_date, treat as start point.
        const start = a.start_date ? new Date(a.start_date) : (a.due_date ? new Date(a.due_date) : null);
        const end = a.due_date ? new Date(a.due_date) : (a.start_date ? new Date(a.start_date) : null);

        if (!start || !end) return false;

        // Check 1: Overlapping (Spanning)
        // Action is visible if it starts before dayEnd and ends after dayStart
        const isOverlapping = start <= dayEnd && end >= dayStart;

        // Check 2: Overdue
        // If due date is in the past (< dayStart) AND status is NOT Done
        const isOverdue = end < dayStart && a.status !== 'Done';

        return isOverlapping || isOverdue;
    });

    // Helper to calculate clamp grid position
    const getActionStyle = (a: Action) => {
        const dayStart = new Date(currentDate);
        dayStart.setHours(6, 0, 0, 0); // Grid starts at 06:00
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(21, 0, 0, 0); // Visual cutoff

        // Re-construct start/end for calculation
        const start = a.start_date ? new Date(a.start_date) : new Date(a.due_date!);
        const end = a.due_date ? new Date(a.due_date) : new Date(a.start_date!);

        // Handle Overdue: Show at 06:00 (start of day) pinned, distinct look
        const dayStartAbsolute = new Date(currentDate);
        dayStartAbsolute.setHours(0, 0, 0, 0);
        if (end < dayStartAbsolute && a.status !== 'Done') {
            return { top: '0px', height: '32px', isOverdue: true };
        }

        // Clip start/end to today's grid hours
        // If spanning multiple days, on 'middle' days it should fill the whole column
        const effectiveStart = start < dayStart ? dayStart : start;
        const effectiveEnd = end > dayEnd ? dayEnd : end;

        if (effectiveEnd <= effectiveStart) {
            // It might be late at night or early morning outside grid
            return null;
        }

        const startHour = 6;
        const pixelsPerHour = 64;

        const top = (effectiveStart.getHours() - startHour) * pixelsPerHour + (effectiveStart.getMinutes() / 60) * pixelsPerHour;
        const durationMins = (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000;
        const height = (durationMins / 60) * pixelsPerHour;

        // Min height for visibility
        return { top: `${Math.max(0, top)}px`, height: `${Math.max(24, height)}px`, isOverdue: false };
    };

    // Separate footer actions (only strictly all-day if required, but user wants visibility on days)
    // We try to put everything in grid. 
    // If strict "All Day" flag existed we'd use footer. 
    // For now, if getActionStyle returns null (outside grid hours), we put in footer?
    const timedActionsWithStyle = dayActions.map(a => {
        const style = getActionStyle(a);
        return { action: a, style };
    }).filter(item => item.style !== null);

    // Items that are valid for today but fell outside 06:00-21:00 grid, render in footer
    const footerActions = dayActions.filter(a => {
        const style = getActionStyle(a);
        return style === null;
    });

    const getTagColor = (itemTags?: string[]) => {
        if (!itemTags || itemTags.length === 0) return null;
        const tag = tags.find(t => t.name === itemTags[0]);
        return tag?.color;
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {/* Vacation Banner */}
                {dayVacation.length > 0 && (
                    <div className="bg-orange-100 border-b border-orange-200 p-2 text-center text-orange-800 font-medium">
                        🌴 Vacation: {dayVacation.map(v => v.type).join(', ')}
                    </div>
                )}

                {/* Grid */}
                <div className="relative min-h-[800px]">
                    {hours.map(hour => (
                        <div
                            key={hour}
                            onClick={() => onTimeSlotClick(currentDate, `${hour.toString().padStart(2, '0')}:00`)}
                            className="flex border-b border-border h-16 group cursor-pointer hover:bg-muted/5 transition-colors"
                        >
                            <div className="w-16 bg-muted/30 border-r border-border text-xs text-text-muted p-2 text-right font-mono">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            <div className="flex-1 relative">
                            </div>
                        </div>
                    ))}

                    {/* Work Entry Visualization (Overlay) */}
                    {dayWork && dayWork.start_time && dayWork.end_time && (
                        <div
                            className="absolute left-16 right-0 bg-secondary/10 border-l-4 border-secondary pointer-events-none opacity-50"
                            style={{
                                top: `${(parseInt(dayWork.start_time.split(':')[0]) - 6) * 64 + (parseInt(dayWork.start_time.split(':')[1]) / 60) * 64}px`,
                                height: `${((new Date(`1970-01-01T${dayWork.end_time}`).getTime() - new Date(`1970-01-01T${dayWork.start_time}`).getTime()) / 3600000) * 64}px`
                            }}
                        >
                            <span className="text-xs font-semibold text-secondary-foreground p-1">Work</span>
                        </div>
                    )}

                    {/* Meetings Rendering */}
                    {dayMeetings.map(m => {
                        const style = dateUtils.getGridPosition(m.date_time, 60); // Default 60 mins if calculated duration missing
                        if (!style) return null;
                        const color = getTagColor(m.tags);
                        const timeStr = dateUtils.formatTime(m.date_time);

                        return (
                            <Link
                                to={`/meetings/${m.id}`}
                                key={m.id}
                                className="absolute left-20 right-4 rounded-md border p-2 hover:brightness-95 transition-all shadow-sm z-10 overflow-hidden flex flex-col justify-center"
                                style={{
                                    ...style,
                                    backgroundColor: color || '#dbeafe',
                                    borderColor: color || '#bfdbfe',
                                    color: color ? '#fff' : '#1e40af'
                                }}
                            >
                                <div className="font-semibold text-sm truncate">{m.title}</div>
                                <div className="text-xs opacity-90 truncate">{timeStr}</div>
                            </Link>
                        );
                    })}

                    {/* Timed Actions Rendering */}
                    {timedActionsWithStyle.map(({ action: a, style: styleInfo }) => {
                        if (!styleInfo) return null; // Should be filtered already

                        const colColor = getTagColor(a.tags);
                        const isOverdue = styleInfo.isOverdue;

                        return (
                            <Link
                                to={`/actions/${a.id}`}
                                key={a.id}
                                className={`absolute left-24 right-8 rounded-md border px-2 border-l-4 hover:brightness-95 transition-all shadow-sm z-20 overflow-hidden flex items-center gap-2
                                    ${isOverdue ? 'bg-red-100 border-red-500 text-red-900 animate-in fade-in' : ''}
                                `}
                                style={{
                                    top: styleInfo.top,
                                    height: styleInfo.height,
                                    backgroundColor: !isOverdue ? (colColor ? `${colColor}15` : '#fef2f2') : undefined,
                                    borderColor: !isOverdue ? (colColor || '#fca5a5') : undefined,
                                    borderStyle: 'solid',
                                    borderLeftColor: !isOverdue ? (colColor || '#ef4444') : undefined,
                                    color: !isOverdue ? (colColor || '#991b1b') : undefined,
                                }}
                            >
                                <div className="font-semibold text-xs truncate flex items-center gap-1.5 flex-1">
                                    <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                                    <span>{a.title}</span>
                                    {isOverdue && <span className="ml-2 text-[10px] font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded border border-red-300">OVERDUE</span>}
                                </div>
                                {!isOverdue && <div className="text-[10px] opacity-80 whitespace-nowrap font-mono">
                                    {/* Show start time if meaningful */}
                                    {dateUtils.formatTime(a.start_date || a.due_date || '')}
                                </div>}
                            </Link>
                        );
                    })}

                </div>
            </div>

            {/* Footer Actions List (All Day / Deadline items outside grid) */}
            {footerActions.length > 0 && (
                <div className="border-t border-border p-4 bg-muted/10">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Actions (Outside Grid Hours)
                    </h3>
                    <div className="space-y-1">
                        {footerActions.map(a => (
                            <Link to={`/actions/${a.id}`} key={a.id} className="block text-sm p-2 bg-background border border-border rounded-md hover:border-primary transition-colors">
                                <span className={a.status === 'Done' ? 'line-through text-text-muted' : ''}>{a.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
