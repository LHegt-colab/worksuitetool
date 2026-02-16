-- Add linking columns to journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS meeting_ids bigint[],
ADD COLUMN IF NOT EXISTS action_ids bigint[],
ADD COLUMN IF NOT EXISTS knowledge_page_ids bigint[];
