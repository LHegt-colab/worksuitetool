-- LET OP: Dit verwijdert alle bestaande actions!
drop table if exists actions cascade;

create table actions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  description text,
  status text check (status in ('Open', 'Doing', 'Waiting', 'Done', 'Archived')) default 'Open',
  priority text check (priority in ('Low', 'Medium', 'High')) default 'Medium',
  due_date timestamp with time zone,
  grid_area text,
  tags text[],
  meeting_id uuid references meetings(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_focus boolean default false
);

alter table actions enable row level security;

create policy "Users can CRUD own actions" on actions for all using (auth.uid() = user_id);
