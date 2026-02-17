import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type Meeting = Database['public']['Tables']['meetings']['Row'];
export type NewMeeting = Database['public']['Tables']['meetings']['Insert'];
export type UpdateMeeting = Database['public']['Tables']['meetings']['Update'];

export const meetingsApi = {
    async getMeetings() {
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .order('date_time', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getMeeting(id: string) {
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createMeeting(meeting: NewMeeting | NewMeeting[]) {
        console.log('Creating meeting(s) with payload:', meeting);
        const { data, error } = await supabase
            .from('meetings')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(meeting as any)
            .select();

        if (error) {
            console.error('Supabase createMeeting error:', error);
            throw error;
        }

        // Return single object if single input, else array
        return Array.isArray(meeting) ? data : (data ? data[0] : null);
    },

    async updateMeeting(id: string, updates: UpdateMeeting) {
        const { data, error } = await supabase
            .from('meetings')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteMeeting(id: string) {
        const { error } = await supabase
            .from('meetings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
