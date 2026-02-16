-- Add label_ids column to tables that use TagSelector but are missing the column in the previous migration

ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS label_ids uuid[];

ALTER TABLE public.actions 
ADD COLUMN IF NOT EXISTS label_ids uuid[];

ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS label_ids uuid[];

ALTER TABLE public.knowledge_pages 
ADD COLUMN IF NOT EXISTS label_ids uuid[];
