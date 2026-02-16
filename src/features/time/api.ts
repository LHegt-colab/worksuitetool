import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
export type NewTimeEntry = Database['public']['Tables']['time_entries']['Insert'];
export type UpdateTimeEntry = Database['public']['Tables']['time_entries']['Update'];

// Type guard or helper if needed, but for now just utilizing the updated Database type


export const timeApi = {
    async getEntries(startDate?: string, endDate?: string) {
        let query = supabase
            .from('time_entries')
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

    async getEntriesByYear(year: number) {
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;

        const { data, error } = await supabase
            .from('time_entries')
            .select('*')
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true }); // Ascending for planning view

        if (error) throw error;
        return data;
    },

    async createEntry(entry: NewTimeEntry) {
        const { data, error } = await supabase
            .from('time_entries')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(entry as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateEntry(id: string, updates: UpdateTimeEntry) {
        const { data, error } = await supabase
            .from('time_entries')
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
            .from('time_entries')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
