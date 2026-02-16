-- 1. Journal Update: Add linking columns
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS meeting_ids uuid[],
ADD COLUMN IF NOT EXISTS action_ids uuid[],
ADD COLUMN IF NOT EXISTS knowledge_page_ids uuid[];

-- 2. Knowledge Update: Add linking columns
ALTER TABLE public.knowledge_pages 
ADD COLUMN IF NOT EXISTS action_ids uuid[];

-- 3. Time Management: Create time_entries table
create table if not exists public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  date date not null default current_date,
  duration integer not null, -- in minutes
  description text,
  action_id uuid references public.actions(id), -- Optional link to action
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.time_entries enable row level security;
drop policy if exists "Users can CRUD own time entries" on public.time_entries;
create policy "Users can CRUD own time entries" on public.time_entries for all using (auth.uid() = user_id);
