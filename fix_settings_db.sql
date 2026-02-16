-- TAGS
create table if not exists tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  color text,
  created_at timestamp with time zone default now()
);
alter table tags enable row level security;
drop policy if exists "Users can CRUD own tags" on tags;
create policy "Users can CRUD own tags" on tags for all using (auth.uid() = user_id);

-- GRIDS
create table if not exists grids (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  created_at timestamp with time zone default now()
);
alter table grids enable row level security;
drop policy if exists "Users can CRUD own grids" on grids;
create policy "Users can CRUD own grids" on grids for all using (auth.uid() = user_id);
