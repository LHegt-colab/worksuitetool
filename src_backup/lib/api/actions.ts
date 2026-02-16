import { supabase } from '../supabase';
import type { Action, CreateActionDTO, UpdateActionDTO } from '../../types';

export const actionsApi = {
    async fetchActions(startDate?: string, endDate?: string) {
        let query = supabase
            .from('actions')
            .select('*')
            .order('due_date', { ascending: true }); // Primary sort by deadline

        if (startDate) {
            // Filter by overlapping range or due date within range
            // Simple approach: due_date within range OR start_date within range
            query = query.or(`due_date.gte.${startDate},start_date.gte.${startDate}`);
        }
        if (endDate) {
            query = query.or(`due_date.lte.${endDate},start_date.lte.${endDate}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching actions:', JSON.stringify(error, null, 2));
            throw error;
        }
        return data as Action[];
    },

    async getActionById(id: string) {
        const { data, error } = await supabase
            .from('actions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Action;
    },

    async createAction(action: CreateActionDTO) {
        const { data, error } = await supabase
            .from('actions')
            .insert([action])
            .select()
            .single();

        if (error) throw error;
        return data as Action;
    },

    async updateAction(id: string, updates: UpdateActionDTO) {
        const { data, error } = await supabase
            .from('actions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Action;
    },

    async deleteAction(id: string) {
        const { error } = await supabase
            .from('actions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
