export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            actions: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string | null
                    status: 'Open' | 'Doing' | 'Waiting' | 'Done' | 'Archived'
                    priority: 'Low' | 'Medium' | 'High'
                    due_date: string | null
                    tags: string[] | null
                    meeting_id: string | null
                    created_at: string
                    updated_at: string
                    is_focus: boolean
                    // New fields
                    start_date: string | null
                    label_ids: string[] | null
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    description?: string | null
                    status?: 'Open' | 'Doing' | 'Waiting' | 'Done' | 'Archived'
                    priority?: 'Low' | 'Medium' | 'High'
                    due_date?: string | null
                    tags?: string[] | null
                    meeting_id?: string | null
                    created_at?: string
                    updated_at?: string
                    is_focus?: boolean
                    start_date?: string | null
                    label_ids?: string[] | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    status?: 'Open' | 'Doing' | 'Waiting' | 'Done' | 'Archived'
                    priority?: 'Low' | 'Medium' | 'High'
                    due_date?: string | null
                    tags?: string[] | null
                    meeting_id?: string | null
                    created_at?: string
                    updated_at?: string
                    is_focus?: boolean
                    start_date?: string | null
                    label_ids?: string[] | null
                }
            }
            decisions: {
                Row: {
                    id: string
                    user_id: string
                    meeting_id: string | null
                    description: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    meeting_id?: string | null
                    description: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    meeting_id?: string | null
                    description?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            journal_entries: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    content: string
                    date: string
                    tags: string[] | null
                    created_at: string
                    updated_at: string
                    label_ids: string[] | null
                    meeting_ids: string[] | null
                    action_ids: string[] | null
                    knowledge_page_ids: string[] | null
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    content: string
                    date: string
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                    label_ids?: string[] | null
                    meeting_ids?: string[] | null
                    action_ids?: string[] | null
                    knowledge_page_ids?: string[] | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    content?: string
                    date?: string
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                    label_ids?: string[] | null
                    meeting_ids?: string[] | null
                    action_ids?: string[] | null
                    knowledge_page_ids?: string[] | null
                }
            }
            knowledge_pages: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    content: string | null
                    grid_area: string | null
                    tags: string[] | null
                    is_pinned: boolean
                    created_at: string
                    updated_at: string
                    urls: string[] | null
                    label_ids: string[] | null
                    action_ids: string[] | null
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    content?: string | null
                    grid_area?: string | null
                    tags?: string[] | null
                    is_pinned?: boolean
                    created_at?: string
                    updated_at?: string
                    urls?: string[] | null
                    label_ids?: string[] | null
                    action_ids?: string[] | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    content?: string | null
                    grid_area?: string | null
                    tags?: string[] | null
                    is_pinned?: boolean
                    created_at?: string
                    updated_at?: string
                    urls?: string[] | null
                    label_ids?: string[] | null
                    action_ids?: string[] | null
                }
            }
            meetings: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    date_time: string
                    location: string | null
                    participants: string | null
                    notes: string | null
                    decisions: string | null
                    tags: string[] | null
                    created_at: string
                    updated_at: string
                    label_ids: string[] | null
                    end_time: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    date_time: string
                    location?: string | null
                    participants?: string | null
                    notes?: string | null
                    decisions?: string | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                    label_ids?: string[] | null
                    end_time?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    date_time?: string
                    location?: string | null
                    participants?: string | null
                    notes?: string | null
                    decisions?: string | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                    label_ids?: string[] | null
                    end_time?: string | null
                }
            }
            tags: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    color: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    name: string
                    color?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    color?: string | null
                    created_at?: string
                }
            }
            time_entries: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    duration: number
                    description: string | null
                    action_id: string | null
                    created_at: string
                    updated_at: string
                    // New fields
                    start_time: string | null
                    end_time: string | null
                    break_duration: number
                    type: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    date: string
                    duration: number
                    description?: string | null
                    action_id?: string | null
                    created_at?: string
                    updated_at?: string
                    start_time?: string | null
                    end_time?: string | null
                    break_duration?: number
                    type?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    duration?: number
                    description?: string | null
                    action_id?: string | null
                    created_at?: string
                    updated_at?: string
                    start_time?: string | null
                    end_time?: string | null
                    break_duration?: number
                    type?: string
                }
            }
            settings: {
                Row: {
                    id: string
                    user_id: string
                    contract_hours_per_week: number
                    vacation_days_per_year: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    contract_hours_per_week?: number
                    vacation_days_per_year?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    contract_hours_per_week?: number
                    vacation_days_per_year?: number
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
