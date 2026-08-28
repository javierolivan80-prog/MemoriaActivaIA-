create table if not exists public.family_chat_threads (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  title text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_chat_threads_elderly_id_idx on public.family_chat_threads (elderly_id);
create index if not exists family_chat_threads_elderly_id_updated_at_idx on public.family_chat_threads (elderly_id, updated_at desc);

alter table public.family_chat_threads enable row level security;

drop policy if exists "Members can view chat threads for their elderly" on public.family_chat_threads;
create policy "Members can view chat threads for their elderly"
  on public.family_chat_threads for select
  using (public.has_elderly_access(elderly_id));

drop policy if exists "Members can create chat threads for their elderly" on public.family_chat_threads;
create policy "Members can create chat threads for their elderly"
  on public.family_chat_threads for insert
  with check (public.has_elderly_access(elderly_id));

drop policy if exists "Members can update chat threads for their elderly" on public.family_chat_threads;
create policy "Members can update chat threads for their elderly"
  on public.family_chat_threads for update
  using (public.has_elderly_access(elderly_id));

drop policy if exists "Members can delete chat threads for their elderly" on public.family_chat_threads;
create policy "Members can delete chat threads for their elderly"
  on public.family_chat_threads for delete
  using (public.has_elderly_access(elderly_id));

-- Add thread_id to existing messages.
alter table public.family_chat_messages
  add column if not exists thread_id uuid references public.family_chat_threads(id) on delete cascade;

-- Backfill: create one "General" thread per elderly_id that already has
-- messages, owned by that profile's owner, and assign existing messages to it.
do $$
declare
  rec record;
  new_thread_id uuid;
begin
  for rec in
    select distinct elderly_id from public.family_chat_messages where thread_id is null
  loop
    insert into public.family_chat_threads (elderly_id, title, created_by)
    select rec.elderly_id, 'General', p.user_id
    from public.elderly_profiles p
    where p.id = rec.elderly_id
    returning id into new_thread_id;

    update public.family_chat_messages
    set thread_id = new_thread_id
    where elderly_id = rec.elderly_id and thread_id is null;
  end loop;
end $$;

alter table public.family_chat_messages
  alter column thread_id set not null;

create index if not exists family_chat_messages_thread_id_created_at_idx
  on public.family_chat_messages (thread_id, created_at asc);

-- Keep thread.updated_at current so threads can be sorted by recent activity.
create or replace function public.touch_chat_thread_updated_at()
returns trigger as $$
begin
  update public.family_chat_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists family_chat_messages_touch_thread on public.family_chat_messages;
create trigger family_chat_messages_touch_thread
  after insert on public.family_chat_messages
  for each row execute function public.touch_chat_thread_updated_at();
