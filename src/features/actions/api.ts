import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type Action = Database['public']['Tables']['actions']['Row'];
export type NewAction = Database['public']['Tables']['actions']['Insert'];
export type UpdateAction = Database['public']['Tables']['actions']['Update'];

export const actionsApi = {
    async getActions() {
        const { data, error } = await supabase
            .from('actions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getAction(id: string) {
        const { data, error } = await supabase
            .from('actions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createAction(action: NewAction) {
        const { data, error } = await supabase
            .from('actions')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(action as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateAction(id: string, updates: UpdateAction) {
        const { data, error } = await supabase
            .from('actions')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteAction(id: string) {
        const { error } = await supabase
            .from('actions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
