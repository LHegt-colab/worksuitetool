-- LET OP: Dit verwijdert alle bestaande knowledge pages!
drop table if exists knowledge_pages cascade;

create table knowledge_pages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  content text,
  grid_area text,
  tags text[],
  is_pinned boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table knowledge_pages enable row level security;

create policy "Users can CRUD own knowledge" on knowledge_pages for all using (auth.uid() = user_id);
