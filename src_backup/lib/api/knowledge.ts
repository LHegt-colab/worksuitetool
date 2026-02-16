import { supabase } from '../supabase';
import type { KnowledgePage, CreateKnowledgePageDTO, UpdateKnowledgePageDTO } from '../../types';

export const knowledgeApi = {
    async fetchPages() {
        const { data, error } = await supabase
            .from('knowledge_pages')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching knowledge pages:', error);
            throw error;
        }
        return data as KnowledgePage[];
    },

    async getPageById(id: string) {
        const { data, error } = await supabase
            .from('knowledge_pages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as KnowledgePage;
    },

    async createPage(page: CreateKnowledgePageDTO) {
        const { data, error } = await supabase
            .from('knowledge_pages')
            .insert([page])
            .select()
            .single();

        if (error) throw error;
        return data as KnowledgePage;
    },

    async updatePage(id: string, updates: UpdateKnowledgePageDTO) {
        const { data, error } = await supabase
            .from('knowledge_pages')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as KnowledgePage;
    },

    async deletePage(id: string) {
        const { error } = await supabase
            .from('knowledge_pages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
