
export const dateUtils = {
    /**
     * Converts a Date object to a local YYYY-MM-DD string.
     * Use this for database queries and comparisons where time is irrelevant.
     */
    toLocalDateKey: (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Checks if two dates represent the same day.
     * Handles mixed inputs: Date objects, ISO strings, or YYYY-MM-DD strings.
     */
    isSameDay: (date1?: string | Date, date2?: string | Date): boolean => {
        if (!date1 || !date2) return false;

        const getKey = (d: string | Date): string => {
            if (d instanceof Date) return dateUtils.toLocalDateKey(d);
            if (d.length === 10 && !d.includes('T')) return d; // Already YYYY-MM-DD
            return dateUtils.toLocalDateKey(new Date(d)); // Parse ISO/other
        };

        return getKey(date1) === getKey(date2);
    },

    /**
     * Extracts the time (HH:MM) from a date string or object.
     */
    formatTime: (date: string | Date): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    /**
     * Parsing a "YYYY-MM-DD" + "HH:MM" into a Date object.
     */
    combineDateAndTime: (datePart: Date, timePart: string): Date => {
        const d = new Date(datePart);
        const [hours, minutes] = timePart.split(':').map(Number);
        d.setHours(hours, minutes, 0, 0);
        return d;
    },

    /**
     * Gets the grid position (top px, height px) for a time range.
     * Assumes 64px per hour, starting at 06:00.
     */
    getGridPosition: (startTime: string | Date, durationMinutes: number = 60) => {
        const d = typeof startTime === 'string' ? new Date(startTime) : startTime;
        const hour = d.getHours();
        const minute = d.getMinutes();

        const startHour = 6; // Grid starts at 6:00
        const pixelsPerHour = 64;

        if (hour < startHour) return null; // Before grid start

        const top = (hour - startHour) * pixelsPerHour + (minute / 60) * pixelsPerHour;
        const height = (durationMinutes / 60) * pixelsPerHour;

        return { top: `${top}px`, height: `${height}px` };
    }
};
