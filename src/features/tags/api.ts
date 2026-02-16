import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type Tag = Database['public']['Tables']['tags']['Row'];
export type NewTag = Database['public']['Tables']['tags']['Insert'];
export type UpdateTag = Database['public']['Tables']['tags']['Update'];

export const tagsApi = {
    async getTags() {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    },

    async createTag(tag: NewTag) {
        const { data, error } = await supabase
            .from('tags')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(tag as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateTag(id: string, updates: UpdateTag) {
        const { data, error } = await supabase
            .from('tags')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteTag(id: string) {
        const { error } = await supabase
            .from('tags')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
