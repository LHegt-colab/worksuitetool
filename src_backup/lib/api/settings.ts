import { supabase } from '../supabase';
import type { Tag, Grid } from '../../types';

export const settingsApi = {
    // TAGS
    async fetchTags() {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching tags:', error);
            throw error;
        }
        return data as Tag[];
    },

    async createTag(name: string, color?: string) {
        const { data, error } = await supabase
            .from('tags')
            .insert([{ name, color }])
            .select()
            .single();

        if (error) throw error;
        return data as Tag;
    },

    async deleteTag(id: string) {
        const { error } = await supabase
            .from('tags')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // GRIDS
    async fetchGrids() {
        const { data, error } = await supabase
            .from('grids')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching grids:', error);
            throw error;
        }
        return data as Grid[];
    },

    async createGrid(name: string) {
        const { data, error } = await supabase
            .from('grids')
            .insert([{ name }])
            .select()
            .single();

        if (error) throw error;
        return data as Grid;
    },

    async deleteGrid(id: string) {
        const { error } = await supabase
            .from('grids')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
