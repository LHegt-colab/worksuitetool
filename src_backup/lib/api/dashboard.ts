import { supabase } from '../supabase';
import type { Meeting } from '../../types';

export const dashboardApi = {
    async getStats() {
        const today = new Date().toISOString().slice(0, 10);
        const user = (await supabase.auth.getUser()).data.user;

        if (!user) throw new Error('User not authenticated');

        // 1. Open Actions Count
        const { count: openActionsCount, error: actionsError } = await supabase
            .from('actions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .neq('status', 'Done')
            .neq('status', 'Archived');

        if (actionsError) console.error('Error fetching actions count:', actionsError);

        // 2. Today's Meetings
        // We filter where date_time starts with today's date (YYYY-MM-DD)
        const { data: todaysMeetings, error: meetingsError } = await supabase
            .from('meetings')
            .select('*')
            .eq('user_id', user.id)
            .gte('date_time', `${today}T00:00:00`)
            .lte('date_time', `${today}T23:59:59`)
            .order('date_time', { ascending: true });

        if (meetingsError) console.error('Error fetching meetings:', meetingsError);

        // 3. Journal Entry Status (Did we write today?)
        const { data: journalEntry, error: journalError } = await supabase
            .from('journal_entries')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        if (journalError) console.error('Error fetching journal status:', journalError);

        return {
            openActionsCount: openActionsCount || 0,
            todaysMeetings: (todaysMeetings as Meeting[]) || [],
            hasJournalEntry: !!journalEntry
        };
    }
};
