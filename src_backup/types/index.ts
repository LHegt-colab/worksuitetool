export interface Meeting {
    id: string;
    user_id: string;
    title: string;
    date_time: string; // ISO string
    location?: string;
    participants?: string; // specific type can be added later if needed
    notes?: string;
    decisions?: string;
    grid_area?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export type CreateMeetingDTO = Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateMeetingDTO = Partial<CreateMeetingDTO>;

export type ActionStatus = 'Open' | 'Doing' | 'Waiting' | 'Done' | 'Archived';
export type ActionPriority = 'Low' | 'Medium' | 'High';

export interface Action {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: ActionStatus;
    priority: ActionPriority;
    start_date?: string; // ISO string
    due_date?: string; // ISO string
    grid_area?: string;
    tags?: string[];
    meeting_id?: string;
    is_focus?: boolean;
    created_at: string;
    updated_at: string;
}

export type CreateActionDTO = Omit<Action, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateActionDTO = Partial<CreateActionDTO>;

export interface JournalEntry {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    content?: string;
    content_done?: string; // Constructive/Legacy
    content_learnings?: string; // Constructive/Legacy
    content_friction?: string; // Constructive/Legacy

    linked_meeting_ids?: string[];
    linked_action_ids?: string[];
    linked_knowledge_ids?: string[];

    grid_area?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export type CreateJournalEntryDTO = Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateJournalEntryDTO = Partial<CreateJournalEntryDTO>;

export interface KnowledgePage {
    id: string;
    user_id: string;
    title: string;
    content?: string;
    grid_area?: string;
    tags?: string[];
    is_pinned?: boolean;
    created_at: string;
    updated_at: string;
}

export type CreateKnowledgePageDTO = Omit<KnowledgePage, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateKnowledgePageDTO = Partial<CreateKnowledgePageDTO>;

export interface Tag {
    id: string;
    user_id: string;
    name: string;
    color?: string;
    created_at: string;
}

export interface Grid {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
}

export interface WorkEntry {
    id: string;
    user_id: string;
    date: string;
    start_time?: string;
    end_time?: string;
    break_minutes: number;
    notes?: string;
    created_at: string;
}

export type UpsertWorkEntryDTO = Omit<WorkEntry, 'id' | 'user_id' | 'created_at'>;

export interface OvertimeAdjustment {
    id: string;
    user_id: string;
    date: string;
    minutes: number;
    reason?: string;
    created_at: string;
}

export interface VacationTransaction {
    id: string;
    user_id: string;
    date: string;
    type: 'Grant' | 'Purchase' | 'Usage' | 'Adjustment';
    hours: number;
    notes?: string;
    created_at: string;
}

export type CreateVacationTransactionDTO = Omit<VacationTransaction, 'id' | 'user_id' | 'created_at'>;
