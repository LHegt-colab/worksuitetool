-- COMPREHENSIVE FIX FOR JOURNAL & LINKING ISSUES
-- Run this entire script in Supabase SQL Editor

-- 1. Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fix JOURNAL_ENTRIES table
-- Ensure 'label_ids' exists and is UUID[]
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS label_ids uuid[];
-- Attempt to convert if it exists as different type (e.g. text[])
ALTER TABLE public.journal_entries ALTER COLUMN label_ids TYPE uuid[] USING label_ids::text::uuid[];

-- Ensure 'meeting_ids' exists and is UUID[]
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS meeting_ids uuid[];
ALTER TABLE public.journal_entries ALTER COLUMN meeting_ids TYPE uuid[] USING meeting_ids::text::uuid[];

-- Ensure 'action_ids' exists and is UUID[]
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS action_ids uuid[];
ALTER TABLE public.journal_entries ALTER COLUMN action_ids TYPE uuid[] USING action_ids::text::uuid[];

-- Ensure 'knowledge_page_ids' exists and is UUID[]
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS knowledge_page_ids uuid[];
ALTER TABLE public.journal_entries ALTER COLUMN knowledge_page_ids TYPE uuid[] USING knowledge_page_ids::text::uuid[];

-- Ensure 'user_id' defaults to auth.uid()
ALTER TABLE public.journal_entries ALTER COLUMN user_id SET DEFAULT auth.uid();


-- 3. Fix other tables needing label_ids
-- Actions
ALTER TABLE public.actions ADD COLUMN IF NOT EXISTS label_ids uuid[];
ALTER TABLE public.actions ALTER COLUMN label_ids TYPE uuid[] USING label_ids::text::uuid[];

-- Meetings
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS label_ids uuid[];
ALTER TABLE public.meetings ALTER COLUMN label_ids TYPE uuid[] USING label_ids::text::uuid[];

-- Knowledge Pages
ALTER TABLE public.knowledge_pages ADD COLUMN IF NOT EXISTS label_ids uuid[];
ALTER TABLE public.knowledge_pages ALTER COLUMN label_ids TYPE uuid[] USING label_ids::text::uuid[];


-- 4. Reset Policies (Fix Permissions)
-- Journal Entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own journal" ON public.journal_entries;
CREATE POLICY "Users can CRUD own journal" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

-- Actions
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own actions" ON public.actions;
CREATE POLICY "Users can CRUD own actions" ON public.actions FOR ALL USING (auth.uid() = user_id);

-- Meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own meetings" ON public.meetings;
CREATE POLICY "Users can CRUD own meetings" ON public.meetings FOR ALL USING (auth.uid() = user_id);

-- Knowledge
ALTER TABLE public.knowledge_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own knowledge" ON public.knowledge_pages;
CREATE POLICY "Users can CRUD own knowledge" ON public.knowledge_pages FOR ALL USING (auth.uid() = user_id);

-- 5. Fix Time Entries (just in case)
CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  date date not null default current_date,
  duration integer not null,
  description text,
  action_id uuid references public.actions(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own time entries" ON public.time_entries;
CREATE POLICY "Users can CRUD own time entries" ON public.time_entries FOR ALL USING (auth.uid() = user_id);
