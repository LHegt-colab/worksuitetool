-- Update journal_entries table for V2 features

-- Add 'content' column if it doesn't exist (consolidating previous fields)
alter table journal_entries 
add column if not exists content text;

-- Add array columns for relations
alter table journal_entries 
add column if not exists linked_meeting_ids text[] default '{}',
add column if not exists linked_action_ids text[] default '{}',
add column if not exists linked_knowledge_ids text[] default '{}';

-- Add tags column if not exists
alter table journal_entries 
add column if not exists tags text[] default '{}';

-- Enable RLS (should already be on, but ensuring policy covers new cols)
alter table journal_entries enable row level security;

-- Ensure policy allows update of these new columns (usually existing policy 'Users can update their own entries' covers all cols, but good to verify)
-- If using specific column grants, we'd need to grant, but typically Supabase policies are row-based.
