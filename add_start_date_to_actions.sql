-- 1. Actions: Add start_date column
alter table public.actions 
add column if not exists start_date timestamp with time zone;

-- 2. Knowledge: Add urls column
alter table public.knowledge_pages 
add column if not exists urls text[];

-- 3. We ignore grid_area (UI request) but keep it in database (Safety Rule).
