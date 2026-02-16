-- LET OP: Dit verwijdert alle bestaande meetings!
drop table if exists meetings cascade;

create table meetings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  date_time timestamp with time zone not null,
  location text,
  participants text,
  notes text,
  decisions text,
  grid_area text,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table meetings enable row level security;

create policy "Users can CRUD own meetings" on meetings for all using (auth.uid() = user_id);
