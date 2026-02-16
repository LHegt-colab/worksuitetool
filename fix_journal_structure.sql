-- Fix missing core columns in journal_entries
-- Run this in Supabase SQL Editor

ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS date date DEFAULT current_date,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Ensure title is not null (optional, but good for data integrity if you want to enforce it later)
-- ALTER TABLE public.journal_entries ALTER COLUMN title SET NOT NULL;
