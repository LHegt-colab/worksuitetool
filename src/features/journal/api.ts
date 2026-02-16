import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type NewJournalEntry = Database['public']['Tables']['journal_entries']['Insert'];
export type UpdateJournalEntry = Database['public']['Tables']['journal_entries']['Update'];

export const journalApi = {
    async getEntries(startDate?: string, endDate?: string) {
        let query = supabase
            .from('journal_entries')
            .select('*')
            .order('date', { ascending: false });

        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getEntry(id: string) {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createEntry(entry: NewJournalEntry) {
        console.log('API createEntry payload:', entry);
        const { data, error } = await supabase
            .from('journal_entries')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(entry as any)
            .select()
            .single();

        if (error) {
            console.error('Supabase createEntry error:', error);
            throw error;
        }
        return data;
    },

    async updateEntry(id: string, updates: UpdateJournalEntry) {
        const { data, error } = await supabase
            .from('journal_entries')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteEntry(id: string) {
        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
