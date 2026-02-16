-- 1. Create Decisions table
create table if not exists public.decisions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  description text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.decisions enable row level security;
drop policy if exists "Users can CRUD own decisions" on public.decisions;
create policy "Users can CRUD own decisions" on public.decisions for all using (auth.uid() = user_id);

-- 2. Add label_ids to entities (linking to tags table)
-- We will use the existing 'tags' table as our 'Labels' source of truth.
-- We add 'label_ids' to store references to the tags table.
alter table public.actions add column if not exists label_ids uuid[];
alter table public.meetings add column if not exists label_ids uuid[];
alter table public.journal_entries add column if not exists label_ids uuid[];
alter table public.knowledge_pages add column if not exists label_ids uuid[];

-- 3. (Optional) If 'tags' table is missing default RLS or columns, ensure it matches:
-- (Assuming tags table exists from initial schema with name, color)
