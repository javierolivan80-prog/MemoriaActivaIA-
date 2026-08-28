alter table public.elderly_profiles
  add column if not exists retell_agent_id text,
  add column if not exists retell_llm_id text;

create table if not exists public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  retell_call_id text unique,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'failed', 'no_answer')),
  transcript text,
  mood text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer
);

create index if not exists conversation_sessions_elderly_id_idx on public.conversation_sessions (elderly_id);
create index if not exists conversation_sessions_retell_call_id_idx on public.conversation_sessions (retell_call_id);

alter table public.conversation_sessions enable row level security;

drop policy if exists "Users can view sessions of their own elderly" on public.conversation_sessions;
create policy "Users can view sessions of their own elderly"
  on public.conversation_sessions for select
  using (
    exists (
      select 1 from public.elderly_profiles p
      where p.id = conversation_sessions.elderly_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert sessions for their own elderly" on public.conversation_sessions;
create policy "Users can insert sessions for their own elderly"
  on public.conversation_sessions for insert
  with check (
    exists (
      select 1 from public.elderly_profiles p
      where p.id = conversation_sessions.elderly_id
        and p.user_id = auth.uid()
    )
  );

create table if not exists public.call_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.conversation_sessions(id) on delete cascade,
  summary text not null,
  important_things jsonb not null default '[]'::jsonb,
  topics_discussed text[] not null default '{}',
  mood_detected text,
  created_at timestamptz not null default now()
);

create index if not exists call_summaries_session_id_idx on public.call_summaries (session_id);

alter table public.call_summaries enable row level security;

drop policy if exists "Users can view summaries of their own elderly" on public.call_summaries;
create policy "Users can view summaries of their own elderly"
  on public.call_summaries for select
  using (
    exists (
      select 1 from public.conversation_sessions s
      join public.elderly_profiles p on p.id = s.elderly_id
      where s.id = call_summaries.session_id
        and p.user_id = auth.uid()
    )
  );

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  content text not null,
  memory_type text not null check (memory_type in ('permanent', 'recent', 'episodic')),
  source text not null,
  confidence double precision not null default 1 check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

create index if not exists memories_elderly_id_idx on public.memories (elderly_id);
create index if not exists memories_elderly_id_created_at_idx on public.memories (elderly_id, created_at desc);

alter table public.memories enable row level security;

drop policy if exists "Users can view memories of their own elderly" on public.memories;
create policy "Users can view memories of their own elderly"
  on public.memories for select
  using (
    exists (
      select 1 from public.elderly_profiles p
      where p.id = memories.elderly_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert memories for their own elderly" on public.memories;
create policy "Users can insert memories for their own elderly"
  on public.memories for insert
  with check (
    exists (
      select 1 from public.elderly_profiles p
      where p.id = memories.elderly_id
        and p.user_id = auth.uid()
    )
  );

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_level integer not null check (alert_level in (1, 2, 3)),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists alerts_user_id_idx on public.alerts (user_id);
create index if not exists alerts_elderly_id_idx on public.alerts (elderly_id);

alter table public.alerts enable row level security;

drop policy if exists "Users can view their own alerts" on public.alerts;
create policy "Users can view their own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own alerts" on public.alerts;
create policy "Users can update their own alerts"
  on public.alerts for update
  using (auth.uid() = user_id);
