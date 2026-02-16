-- Add action_ids to knowledge_pages for linking
ALTER TABLE public.knowledge_pages 
ADD COLUMN IF NOT EXISTS action_ids bigint[];
