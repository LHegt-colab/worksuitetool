import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type KnowledgePage = Database['public']['Tables']['knowledge_pages']['Row'];
export type NewKnowledgePage = Database['public']['Tables']['knowledge_pages']['Insert'];
export type UpdateKnowledgePage = Database['public']['Tables']['knowledge_pages']['Update'];

export const knowledgeApi = {
    async getPages() {
        const { data, error } = await supabase
            .from('knowledge_pages')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getPage(id: string) {
        const { data, error } = await supabase
            .from('knowledge_pages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createPage(page: NewKnowledgePage) {
        const { data, error } = await supabase
            .from('knowledge_pages')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(page as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updatePage(id: string, updates: UpdateKnowledgePage) {
        const { data, error } = await supabase
            .from('knowledge_pages')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deletePage(id: string) {
        const { error } = await supabase
            .from('knowledge_pages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
