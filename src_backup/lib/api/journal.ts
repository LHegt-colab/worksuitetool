import { supabase } from '../supabase';
import type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO } from '../../types';

export const journalApi = {
    async getEntryByDate(date: string) {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('date', date)
            .maybeSingle(); // Returns null if no entry exists, instead of error

        if (error) {
            console.error('Error fetching journal entry:', error);
            throw error;
        }
        return data as JournalEntry | null;
    },

    async fetchEntries() {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching journal entries:', error);
            throw error;
        }
        return data as JournalEntry[];
    },

    async upsertEntry(entry: CreateJournalEntryDTO | UpdateJournalEntryDTO) {
        // upsert requires the conflict target (date + user_id) to be unique
        const { data, error } = await supabase
            .from('journal_entries')
            .upsert(entry, { onConflict: 'user_id,date' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting journal entry:', error);
            throw error;
        }
        return data as JournalEntry;
    }
};
