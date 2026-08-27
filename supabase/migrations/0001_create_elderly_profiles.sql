create extension if not exists pgcrypto;

create table if not exists public.elderly_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone_number text not null,
  age integer,
  family_info jsonb not null default '{}'::jsonb,
  interests text[] not null default '{}',
  hobbies text[] not null default '{}',
  routines text[] not null default '{}',
  favorite_topics text[] not null default '{}',
  sensitive_topics text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists elderly_profiles_user_id_idx on public.elderly_profiles (user_id);

alter table public.elderly_profiles enable row level security;

drop policy if exists "Users can view their own elderly profiles" on public.elderly_profiles;
create policy "Users can view their own elderly profiles"
  on public.elderly_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own elderly profiles" on public.elderly_profiles;
create policy "Users can insert their own elderly profiles"
  on public.elderly_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own elderly profiles" on public.elderly_profiles;
create policy "Users can update their own elderly profiles"
  on public.elderly_profiles for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own elderly profiles" on public.elderly_profiles;
create policy "Users can delete their own elderly profiles"
  on public.elderly_profiles for delete
  using (auth.uid() = user_id);
