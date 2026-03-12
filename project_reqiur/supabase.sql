create extension if not exists "pgcrypto";

create table if not exists work_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text not null,
  priority text not null check (priority in ('low', 'medium', 'high')) default 'medium',
  type text not null check (type in ('project', 'task', 'deadline')) default 'task',
  status text not null check (status in ('pending', 'in-progress', 'completed')) default 'pending',
  details text,
  due_date date,
  created_at timestamptz default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text not null,
  category text not null default 'other',
  created_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  completed boolean default false,
  notes text,
  created_at timestamptz default now(),
  unique(habit_id, date)
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  amount numeric(12, 2) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text,
  date date not null,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null check (type in ('task_deadline', 'habit_reminder', 'system_alert', 'share')),
  title text not null,
  message text not null,
  related_item_id uuid,
  related_item_type text,
  read boolean default false,
  scheduled_time timestamptz,
  sent_email boolean default false,
  sent_push boolean default false,
  created_at timestamptz default now()
);

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  in_app_enabled boolean default true,
  email_enabled boolean default true,
  push_enabled boolean default false,
  task_deadline_hours_before integer default 24,
  habit_reminder_time time default '09:00:00',
  created_at timestamptz default now()
);

create index if not exists idx_work_items_workspace_id on work_items(workspace_id);
create index if not exists idx_work_items_created_at on work_items(created_at desc);

create index if not exists idx_habits_workspace_id on habits(workspace_id);
create index if not exists idx_habits_created_at on habits(created_at desc);

create index if not exists idx_habit_logs_habit_id on habit_logs(habit_id);
create index if not exists idx_habit_logs_date on habit_logs(date);

create index if not exists idx_transactions_workspace_id on transactions(workspace_id);
create index if not exists idx_transactions_date on transactions(date desc);

create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_read on notifications(user_id, read);
create index if not exists idx_notifications_created_at on notifications(created_at desc);

create index if not exists idx_notification_preferences_user_id on notification_preferences(user_id);

alter table work_items enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table transactions enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;

drop policy if exists work_items_select on work_items;
drop policy if exists work_items_insert on work_items;
drop policy if exists work_items_update on work_items;
drop policy if exists work_items_delete on work_items;
create policy work_items_select on work_items for select using (workspace_id = auth.uid());
create policy work_items_insert on work_items for insert with check (workspace_id = auth.uid());
create policy work_items_update on work_items for update using (workspace_id = auth.uid()) with check (workspace_id = auth.uid());
create policy work_items_delete on work_items for delete using (workspace_id = auth.uid());

drop policy if exists habits_select on habits;
drop policy if exists habits_insert on habits;
drop policy if exists habits_update on habits;
drop policy if exists habits_delete on habits;
create policy habits_select on habits for select using (workspace_id = auth.uid());
create policy habits_insert on habits for insert with check (workspace_id = auth.uid());
create policy habits_update on habits for update using (workspace_id = auth.uid()) with check (workspace_id = auth.uid());
create policy habits_delete on habits for delete using (workspace_id = auth.uid());

drop policy if exists habit_logs_select on habit_logs;
drop policy if exists habit_logs_insert on habit_logs;
drop policy if exists habit_logs_update on habit_logs;
drop policy if exists habit_logs_delete on habit_logs;
create policy habit_logs_select on habit_logs for select using (
  exists (
    select 1 from habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
);
create policy habit_logs_insert on habit_logs for insert with check (
  exists (
    select 1 from habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
);
create policy habit_logs_update on habit_logs for update using (
  exists (
    select 1 from habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
) with check (
  exists (
    select 1 from habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
);
create policy habit_logs_delete on habit_logs for delete using (
  exists (
    select 1 from habits h
    where h.id = habit_logs.habit_id and h.workspace_id = auth.uid()
  )
);

drop policy if exists transactions_select on transactions;
drop policy if exists transactions_insert on transactions;
drop policy if exists transactions_update on transactions;
drop policy if exists transactions_delete on transactions;
create policy transactions_select on transactions for select using (workspace_id = auth.uid());
create policy transactions_insert on transactions for insert with check (workspace_id = auth.uid());
create policy transactions_update on transactions for update using (workspace_id = auth.uid()) with check (workspace_id = auth.uid());
create policy transactions_delete on transactions for delete using (workspace_id = auth.uid());

drop policy if exists notifications_select on notifications;
drop policy if exists notifications_insert on notifications;
drop policy if exists notifications_update on notifications;
drop policy if exists notifications_delete on notifications;
create policy notifications_select on notifications for select using (user_id = auth.uid());
create policy notifications_insert on notifications for insert with check (user_id = auth.uid());
create policy notifications_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on notifications for delete using (user_id = auth.uid());

drop policy if exists notification_preferences_select on notification_preferences;
drop policy if exists notification_preferences_insert on notification_preferences;
drop policy if exists notification_preferences_update on notification_preferences;
drop policy if exists notification_preferences_delete on notification_preferences;
create policy notification_preferences_select on notification_preferences for select using (user_id = auth.uid());
create policy notification_preferences_insert on notification_preferences for insert with check (user_id = auth.uid());
create policy notification_preferences_update on notification_preferences for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_delete on notification_preferences for delete using (user_id = auth.uid());
