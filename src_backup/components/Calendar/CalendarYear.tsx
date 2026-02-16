interface CalendarYearProps {
    currentDate: Date;
    setCurrentDate: (d: Date) => void;
    setView: (v: 'month') => void;
}

export default function CalendarYear({ currentDate, setCurrentDate, setView }: CalendarYearProps) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleMonthClick = (monthIndex: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(monthIndex);
        setCurrentDate(newDate);
        setView('month');
    };

    return (
        <div className="grid grid-cols-4 gap-4 h-full overflow-y-auto p-1">
            {months.map((month, idx) => (
                <button
                    key={month}
                    onClick={() => handleMonthClick(idx)}
                    className={`
                        p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all
                        flex flex-col items-center justify-center gap-2
                        ${idx === currentDate.getMonth() ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}
                    `}
                >
                    <span className="text-lg font-semibold">{month}</span>
                </button>
            ))}
        </div>
    );
}
