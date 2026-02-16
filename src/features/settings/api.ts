import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type Settings = Database['public']['Tables']['settings']['Row'];
export type NewSettings = Database['public']['Tables']['settings']['Insert'];
export type UpdateSettings = Database['public']['Tables']['settings']['Update'];

export const settingsApi = {
    async getSettings() {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (error) {
            // If settings don't exist, return default structure (or handle 406)
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async upsertSettings(settings: NewSettings) {
        const { data, error } = await supabase
            .from('settings')
            .upsert(settings as any, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
