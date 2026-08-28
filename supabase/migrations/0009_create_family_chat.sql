create table if not exists public.family_chat_messages (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists family_chat_messages_elderly_id_idx on public.family_chat_messages (elderly_id);
create index if not exists family_chat_messages_elderly_id_created_at_idx on public.family_chat_messages (elderly_id, created_at desc);

alter table public.family_chat_messages enable row level security;

drop policy if exists "Members can view chat messages for their elderly" on public.family_chat_messages;
create policy "Members can view chat messages for their elderly"
  on public.family_chat_messages for select
  using (public.has_elderly_access(elderly_id));

drop policy if exists "Members can send chat messages for their elderly" on public.family_chat_messages;
create policy "Members can send chat messages for their elderly"
  on public.family_chat_messages for insert
  with check (public.has_elderly_access(elderly_id));
