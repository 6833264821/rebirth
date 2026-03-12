create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  username text not null unique,
  avatar_url text,
  timezone text not null default 'Asia/Bangkok',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1) || '-' || substring(new.id::text from 1 for 6)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      username = excluded.username,
      avatar_url = excluded.avatar_url,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null,
  subject text,
  link text,
  priority text not null check (priority in ('low', 'medium', 'high')) default 'medium',
  type text not null check (type in ('project', 'task', 'deadline')) default 'task',
  status text not null check (status in ('pending', 'in-progress', 'completed')) default 'pending',
  details text,
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  frequency text not null default 'daily',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique(habit_id, date)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source text not null check (source in ('internal', 'google')) default 'internal',
  google_event_id text unique,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  type text not null check (type in ('task_deadline', 'habit_reminder', 'system_alert', 'share')),
  title text not null,
  message text not null,
  related_item_id uuid,
  related_item_type text,
  read boolean not null default false,
  scheduled_time timestamptz,
  sent_email boolean not null default false,
  sent_push boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  push_enabled boolean not null default false,
  task_deadline_hours_before integer not null default 24,
  habit_reminder_time time not null default '09:00:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_work_items_workspace_id on public.work_items(workspace_id);
create index if not exists idx_work_items_due_date on public.work_items(due_date);
create index if not exists idx_habits_workspace_id on public.habits(workspace_id);
create index if not exists idx_habit_logs_habit_id_date on public.habit_logs(habit_id, date desc);
create index if not exists idx_transactions_workspace_id_date on public.transactions(workspace_id, date desc);
create index if not exists idx_calendar_events_user_id_starts_at on public.calendar_events(user_id, starts_at);
create index if not exists idx_notifications_user_id_read on public.notifications(user_id, read);
create index if not exists idx_notification_preferences_user_id on public.notification_preferences(user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists work_items_set_updated_at on public.work_items;
create trigger work_items_set_updated_at
before update on public.work_items
for each row execute procedure public.set_updated_at();

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at
before update on public.habits
for each row execute procedure public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute procedure public.set_updated_at();

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute procedure public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.work_items enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.transactions enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid());
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists work_items_select on public.work_items;
drop policy if exists work_items_insert on public.work_items;
drop policy if exists work_items_update on public.work_items;
drop policy if exists work_items_delete on public.work_items;
create policy work_items_select on public.work_items for select using (workspace_id = auth.uid());
create policy work_items_insert on public.work_items for insert with check (workspace_id = auth.uid());
create policy work_items_update on public.work_items for update using (workspace_id = auth.uid()) with check (workspace_id = auth.uid());
create policy work_items_delete on public.work_items for delete using (workspace_id = auth.uid());

drop policy if exists habits_select on public.habits;
drop policy if exists habits_insert on public.habits;
drop policy if exists habits_update on public.habits;
drop policy if exists habits_delete on public.habits;
create policy habits_select on public.habits for select using (workspace_id = auth.uid());
create policy habits_insert on public.habits for insert with check (workspace_id = auth.uid());
create policy habits_update on public.habits for update using (workspace_id = auth.uid()) with check (workspace_id = auth.uid());
create policy habits_delete on public.habits for delete using (workspace_id = auth.uid());

drop policy if exists habit_logs_select on public.habit_logs;
drop policy if exists habit_logs_insert on public.habit_logs;
drop policy if exists habit_logs_update on public.habit_logs;
drop policy if exists habit_logs_delete on public.habit_logs;
create policy habit_logs_select on public.habit_logs for select using (
  exists (
    select 1
    from public.habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
);
create policy habit_logs_insert on public.habit_logs for insert with check (
  exists (
    select 1
    from public.habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
);
create policy habit_logs_update on public.habit_logs for update using (
  exists (
    select 1
    from public.habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
);
create policy habit_logs_delete on public.habit_logs for delete using (
  exists (
    select 1
    from public.habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
);

drop policy if exists transactions_select on public.transactions;
drop policy if exists transactions_insert on public.transactions;
drop policy if exists transactions_update on public.transactions;
drop policy if exists transactions_delete on public.transactions;
create policy transactions_select on public.transactions for select using (workspace_id = auth.uid());
create policy transactions_insert on public.transactions for insert with check (workspace_id = auth.uid());
create policy transactions_update on public.transactions for update using (workspace_id = auth.uid()) with check (workspace_id = auth.uid());
create policy transactions_delete on public.transactions for delete using (workspace_id = auth.uid());

drop policy if exists calendar_events_select on public.calendar_events;
drop policy if exists calendar_events_insert on public.calendar_events;
drop policy if exists calendar_events_update on public.calendar_events;
drop policy if exists calendar_events_delete on public.calendar_events;
create policy calendar_events_select on public.calendar_events for select using (user_id = auth.uid());
create policy calendar_events_insert on public.calendar_events for insert with check (user_id = auth.uid());
create policy calendar_events_update on public.calendar_events for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy calendar_events_delete on public.calendar_events for delete using (user_id = auth.uid());

drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_insert on public.notifications;
drop policy if exists notifications_update on public.notifications;
drop policy if exists notifications_delete on public.notifications;
create policy notifications_select on public.notifications for select using (user_id = auth.uid());
create policy notifications_insert on public.notifications for insert with check (user_id = auth.uid());
create policy notifications_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete using (user_id = auth.uid());

drop policy if exists notification_preferences_select on public.notification_preferences;
drop policy if exists notification_preferences_insert on public.notification_preferences;
drop policy if exists notification_preferences_update on public.notification_preferences;
drop policy if exists notification_preferences_delete on public.notification_preferences;
create policy notification_preferences_select on public.notification_preferences for select using (user_id = auth.uid());
create policy notification_preferences_insert on public.notification_preferences for insert with check (user_id = auth.uid());
create policy notification_preferences_update on public.notification_preferences for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_delete on public.notification_preferences for delete using (user_id = auth.uid());
