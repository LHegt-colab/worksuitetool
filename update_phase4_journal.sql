-- Add new columns
alter table journal_entries add column if not exists content text;
alter table journal_entries add column if not exists linked_meeting_ids uuid[];
alter table journal_entries add column if not exists linked_action_ids uuid[];
alter table journal_entries add column if not exists linked_knowledge_ids uuid[];

-- Migrate existing data (optional, concat old fields into new content if desired)
-- For now, we keep them or ignore them. The user asked for a single field, so we prioritize 'content'.

-- Drop old columns (optional, strictly speaking we can keep them for safety, but user wants to move away)
-- alter table journal_entries drop column if exists content_done;
-- alter table journal_entries drop column if exists content_learnings;
-- alter table journal_entries drop column if exists content_friction;
