import { supabase } from '../supabase';
import type { WorkEntry, UpsertWorkEntryDTO, OvertimeAdjustment, VacationTransaction, CreateVacationTransactionDTO } from '../../types';

export const timeApi = {
    // Work Entries
    async fetchWorkEntries(startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('work_entries')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) throw error;
        return data as WorkEntry[];
    },

    async upsertWorkEntry(entry: UpsertWorkEntryDTO) {
        const { data, error } = await supabase
            .from('work_entries')
            .upsert(entry, { onConflict: 'user_id,date' })
            .select()
            .single();

        if (error) throw error;
        return data as WorkEntry;
    },

    // Overtime Adjustments
    async fetchOvertimeAdjustments() {
        const { data, error } = await supabase
            .from('overtime_adjustments')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data as OvertimeAdjustment[];
    },

    async createOvertimeAdjustment(entry: Omit<OvertimeAdjustment, 'id' | 'user_id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('overtime_adjustments')
            .insert(entry)
            .select()
            .single();

        if (error) throw error;
        return data as OvertimeAdjustment;
    },

    async getOvertimeBalance() {
        const { data, error } = await supabase
            .rpc('get_overtime_balance', { p_user_id: (await supabase.auth.getUser()).data.user?.id });

        if (error) throw error;
        return data as number;
    },

    // Vacation
    async fetchVacationTransactions() {
        const { data, error } = await supabase
            .from('vacation_transactions')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data as VacationTransaction[];
    },

    async createVacationTransaction(entry: CreateVacationTransactionDTO) {
        const { data, error } = await supabase
            .from('vacation_transactions')
            .insert(entry)
            .select()
            .single();

        if (error) throw error;
        return data as VacationTransaction;
    }
};
