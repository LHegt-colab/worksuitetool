import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type Decision = Database['public']['Tables']['decisions']['Row'];
export type NewDecision = Database['public']['Tables']['decisions']['Insert'];
export type UpdateDecision = Database['public']['Tables']['decisions']['Update'];

export const decisionsApi = {
    async getDecisionsByMeeting(meetingId: string) {
        const { data, error } = await supabase
            .from('decisions')
            .select('*')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createDecision(decision: NewDecision) {
        const { data, error } = await supabase
            .from('decisions')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(decision as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateDecision(id: string, updates: UpdateDecision) {
        const { data, error } = await supabase
            .from('decisions')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteDecision(id: string) {
        const { error } = await supabase
            .from('decisions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
