import { supabase } from '../supabase';
import type { Meeting, CreateMeetingDTO, UpdateMeetingDTO } from '../../types';

export const meetingsApi = {
    async fetchMeetings(startDate?: string, endDate?: string) {
        let query = supabase
            .from('meetings')
            .select('*')
            .order('date_time', { ascending: false });

        if (startDate) query = query.gte('date_time', startDate);
        if (endDate) query = query.lte('date_time', endDate);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching meetings:', JSON.stringify(error, null, 2));
            throw error;
        }
        return data as Meeting[];
    },

    async getMeetingById(id: string) {
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Meeting;
    },

    async createMeeting(meeting: CreateMeetingDTO) {
        const { data, error } = await supabase
            .from('meetings')
            .insert([meeting])
            .select()
            .single();

        if (error) throw error;
        return data as Meeting;
    },

    async updateMeeting(id: string, updates: UpdateMeetingDTO) {
        const { data, error } = await supabase
            .from('meetings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Meeting;
    },

    async deleteMeeting(id: string) {
        const { error } = await supabase
            .from('meetings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
