-- KAGE — initial schema (PRD §9). Safe to re-run.
-- Applied via scripts/db-push.mjs using the Supabase Management API.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  experience_level text not null default 'beginner',
  preferred_sport text not null default 'boxing',
  preferred_language text not null default 'en',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  ))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- training_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport text not null default 'boxing',
  session_type text not null default 'shadowboxing',
  experience_level text not null default 'beginner',
  training_focus text not null default 'fundamentals',
  coaching_frequency text not null default 'balanced',
  duration_seconds integer not null default 0,
  rounds integer not null default 3,
  round_seconds integer not null default 180,
  rest_seconds integer not null default 60,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  recording_status text not null default 'idle',
  analysis_status text not null default 'none',
  created_at timestamptz not null default now()
);
create index if not exists training_sessions_user_idx on public.training_sessions (user_id, started_at desc);

alter table public.training_sessions enable row level security;

drop policy if exists "sessions_owner" on public.training_sessions;
create policy "sessions_owner" on public.training_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- session_recordings
-- ---------------------------------------------------------------------------
create table if not exists public.session_recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.training_sessions(id) on delete cascade,
  storage_key text not null,
  mime_type text,
  size_bytes bigint,
  duration_seconds integer,
  retention_expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.session_recordings enable row level security;

drop policy if exists "recordings_owner" on public.session_recordings;
create policy "recordings_owner" on public.session_recordings
  for all using (
    exists (
      select 1 from public.training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- session_reports
-- ---------------------------------------------------------------------------
create table if not exists public.session_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.training_sessions(id) on delete cascade,
  summary text,
  strengths_json jsonb not null default '[]'::jsonb,
  corrections_json jsonb not null default '[]'::jsonb,
  training_plan_json jsonb not null default '{}'::jsonb,
  model_version text,
  analysis_version text,
  created_at timestamptz not null default now()
);

alter table public.session_reports enable row level security;

drop policy if exists "reports_owner" on public.session_reports;
create policy "reports_owner" on public.session_reports
  for all using (
    exists (
      select 1 from public.training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- analysis_jobs
-- ---------------------------------------------------------------------------
create table if not exists public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.training_sessions(id) on delete cascade,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  error_code text,
  started_at timestamptz,
  completed_at timestamptz
);

alter table public.analysis_jobs enable row level security;

drop policy if exists "jobs_owner" on public.analysis_jobs;
create policy "jobs_owner" on public.analysis_jobs
  for all using (
    exists (
      select 1 from public.training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  provider_subscription_id text,
  plan_id text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_owner" on public.subscriptions;
create policy "subscriptions_owner" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- usage_events
-- ---------------------------------------------------------------------------
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.training_sessions(id) on delete set null,
  event_type text not null,
  quantity integer not null default 1,
  estimated_cost numeric,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_idx on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "usage_owner" on public.usage_events;
create policy "usage_owner" on public.usage_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- private storage bucket for recordings
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

drop policy if exists "recordings_read_own" on storage.objects;
create policy "recordings_read_own" on storage.objects
  for select using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recordings_insert_own" on storage.objects;
create policy "recordings_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recordings_update_own" on storage.objects;
create policy "recordings_update_own" on storage.objects
  for update using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recordings_delete_own" on storage.objects;
create policy "recordings_delete_own" on storage.objects
  for delete using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
