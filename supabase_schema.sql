-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Sync with Auth)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  updated_at timestamp with time zone
);
alter table profiles enable row level security;
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- MEETINGS
create table if not exists meetings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  date_time timestamp with time zone not null,
  location text,
  participants text, -- Simple text for v1
  notes text,
  decisions text, -- JSONB or text array could be better, but text is simple for v1
  grid_area text, -- "Management", "Project X"
  tags text[], -- Array of strings
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table meetings enable row level security;
drop policy if exists "Users can CRUD own meetings" on meetings;
create policy "Users can CRUD own meetings" on meetings for all using (auth.uid() = user_id);

-- ACTIONS
create table if not exists actions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  description text,
  status text check (status in ('Open', 'Doing', 'Waiting', 'Done', 'Archived')) default 'Open',
  priority text check (priority in ('Low', 'Medium', 'High')) default 'Medium',
  due_date timestamp with time zone,
  grid_area text,
  tags text[],
  meeting_id uuid references meetings(id), -- Optional link
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_focus boolean default false
);
alter table actions enable row level security;
drop policy if exists "Users can CRUD own actions" on actions;
create policy "Users can CRUD own actions" on actions for all using (auth.uid() = user_id);

-- JOURNAL ENTRIES
create table if not exists journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  date date not null default current_date,
  content_done text, -- "What I did"
  content_learnings text, -- "Highlights/Learnings"
  content_friction text, -- "Friction/Issues"
  grid_area text,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, date) -- One entry per day per user
);
alter table journal_entries enable row level security;
drop policy if exists "Users can CRUD own journal" on journal_entries;
create policy "Users can CRUD own journal" on journal_entries for all using (auth.uid() = user_id);

-- KNOWLEDGE PAGES
create table if not exists knowledge_pages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  content text, -- Rich text content
  grid_area text,
  tags text[],
  is_pinned boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table knowledge_pages enable row level security;
drop policy if exists "Users can CRUD own knowledge" on knowledge_pages;
create policy "Users can CRUD own knowledge" on knowledge_pages for all using (auth.uid() = user_id);

-- TAGS (Managed List)
create table if not exists tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  color text, -- Optional hex code
  created_at timestamp with time zone default now()
);
alter table tags enable row level security;
drop policy if exists "Users can CRUD own tags" on tags;
create policy "Users can CRUD own tags" on tags for all using (auth.uid() = user_id);

-- GRIDS (Managed List)
create table if not exists grids (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  created_at timestamp with time zone default now()
);
alter table grids enable row level security;
drop policy if exists "Users can CRUD own grids" on grids;
create policy "Users can CRUD own grids" on grids for all using (auth.uid() = user_id);

-- Handle On User Created (Trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing; -- Handle conflict if user profile already exists
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on recreation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
