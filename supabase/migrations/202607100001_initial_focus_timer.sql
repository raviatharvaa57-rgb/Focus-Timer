-- Focus Timer's user data is stored per authenticated user. All exposed
-- application tables have RLS enabled and ownership checks in every policy.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Focus User',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_goal text not null default '',
  achievement_preferences jsonb not null default '{"showGoalPrompt": true, "showDailyGoalCompletePopup": true, "showTimerCompletionPopup": true, "showNotificationPermissionPrompt": true, "notificationsEnabled": false}'::jsonb,
  theme_settings jsonb not null default '{"mode": "dark", "autoSwitch": false, "promptSeen": false, "promptEnabled": true}'::jsonb,
  fox_settings jsonb not null default '{}'::jsonb,
  notification_settings jsonb not null default '{}'::jsonb,
  floating_note jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_ms bigint not null check (duration_ms >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in ('dailyGoal', 'timer')),
  unlocked_at timestamptz not null default now()
);

create table if not exists public.alarms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  time text not null,
  label text not null default 'Wake up',
  active boolean not null default true,
  days text[] not null default '{}'::text[],
  sound text not null default 'zen_bowl',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_clocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  timezone_offset numeric not null default 0,
  country text,
  mood text,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_position_idx on public.tasks(user_id, position);
create index if not exists focus_sessions_user_end_time_idx on public.focus_sessions(user_id, end_time desc);
create index if not exists achievements_user_unlocked_at_idx on public.achievements(user_id, unlocked_at desc);
create index if not exists alarms_user_time_idx on public.alarms(user_id, time);
create index if not exists world_clocks_user_created_at_idx on public.world_clocks(user_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Focus User'),
    new.email
  )
  on conflict (id) do update
  set display_name = excluded.display_name,
      email = excluded.email,
      updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at before update on public.user_settings
  for each row execute procedure public.set_updated_at();
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();
drop trigger if exists alarms_set_updated_at on public.alarms;
create trigger alarms_set_updated_at before update on public.alarms
  for each row execute procedure public.set_updated_at();

revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.tasks enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.achievements enable row level security;
alter table public.alarms enable row level security;
alter table public.world_clocks enable row level security;

grant select, insert, update, delete on public.profiles, public.user_settings, public.tasks, public.focus_sessions, public.achievements, public.alarms, public.world_clocks to authenticated;

create policy "Users manage their own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "Users manage their own settings" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users manage their own tasks" on public.tasks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users manage their own focus sessions" on public.focus_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users manage their own achievements" on public.achievements
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users manage their own alarms" on public.alarms
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users manage their own world clocks" on public.world_clocks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
