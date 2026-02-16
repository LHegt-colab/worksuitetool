-- Time Management features

-- 1. work_entries table
create table if not exists work_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  start_time time,
  end_time time,
  break_minutes integer default 30,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

alter table work_entries enable row level security;
drop policy if exists "Users can CRUD their own work entries" on work_entries;
create policy "Users can CRUD their own work entries"
  on work_entries for all
  using (auth.uid() = user_id);

-- 2. overtime_adjustments table (manual entries)
create table if not exists overtime_adjustments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  minutes integer not null, -- Positive (added) or Negative (removed/paid out)
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table overtime_adjustments enable row level security;
drop policy if exists "Users can CRUD their own overtime adjustments" on overtime_adjustments;
create policy "Users can CRUD their own overtime adjustments"
  on overtime_adjustments for all
  using (auth.uid() = user_id);

-- 3. vacation_transactions table
create table if not exists vacation_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  type text not null check (type in ('Grant', 'Purchase', 'Usage', 'Adjustment')),
  hours numeric not null, -- Positive for addition, negative for usage
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table vacation_transactions enable row level security;
drop policy if exists "Users can CRUD their own vacation transactions" on vacation_transactions;
create policy "Users can CRUD their own vacation transactions"
  on vacation_transactions for all
  using (auth.uid() = user_id);

-- 4. Function to calculate total overtime balance
create or replace function get_overtime_balance(p_user_id uuid)
returns numeric as $$
declare
  total_worked_minutes numeric;
  total_days_worked integer;
  manual_adjustments numeric;
  standard_day_minutes integer := 480; -- 8 hours * 60 minutes
begin
  -- Calculate total minutes worked from entries
  select coalesce(sum(
    extract(epoch from (end_time - start_time))/60 - break_minutes
  ), 0),
  count(*)
  into total_worked_minutes, total_days_worked
  from work_entries
  where user_id = p_user_id
  and start_time is not null 
  and end_time is not null;

  -- Calculate manual adjustments
  select coalesce(sum(minutes), 0)
  into manual_adjustments
  from overtime_adjustments
  where user_id = p_user_id;

  -- Formula: (Total Worked - (Days * 480)) + Adjustments
  return (total_worked_minutes - (total_days_worked * standard_day_minutes) + manual_adjustments) / 60.0;
end;
$$ language plpgsql security definer;
