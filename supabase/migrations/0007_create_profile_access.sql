create table if not exists public.elderly_profile_access (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role text not null check (role in ('owner', 'viewer')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  invite_token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now()
);

create unique index if not exists elderly_profile_access_invite_token_idx on public.elderly_profile_access (invite_token);
create index if not exists elderly_profile_access_elderly_id_idx on public.elderly_profile_access (elderly_id);
create index if not exists elderly_profile_access_user_id_idx on public.elderly_profile_access (user_id);

alter table public.elderly_profile_access enable row level security;

drop policy if exists "Members can view their own access row or their elderly's roster" on public.elderly_profile_access;
create policy "Members can view their own access row or their elderly's roster"
  on public.elderly_profile_access for select
  using (
    user_id = auth.uid()
    or invited_email = (auth.jwt() ->> 'email')
    or exists (
      select 1 from public.elderly_profile_access owner_row
      where owner_row.elderly_id = elderly_profile_access.elderly_id
        and owner_row.user_id = auth.uid()
        and owner_row.role = 'owner'
        and owner_row.status = 'accepted'
    )
  );

drop policy if exists "Owners can invite others" on public.elderly_profile_access;
create policy "Owners can invite others"
  on public.elderly_profile_access for insert
  with check (
    exists (
      select 1 from public.elderly_profile_access owner_row
      where owner_row.elderly_id = elderly_profile_access.elderly_id
        and owner_row.user_id = auth.uid()
        and owner_row.role = 'owner'
        and owner_row.status = 'accepted'
    )
  );

drop policy if exists "Invited users can accept their invitation" on public.elderly_profile_access;
create policy "Invited users can accept their invitation"
  on public.elderly_profile_access for update
  using (
    status = 'pending'
    and invited_email = (auth.jwt() ->> 'email')
  )
  with check (
    user_id = auth.uid()
    and status = 'accepted'
  );

drop policy if exists "Owners can remove access" on public.elderly_profile_access;
create policy "Owners can remove access"
  on public.elderly_profile_access for delete
  using (
    role <> 'owner'
    and exists (
      select 1 from public.elderly_profile_access owner_row
      where owner_row.elderly_id = elderly_profile_access.elderly_id
        and owner_row.user_id = auth.uid()
        and owner_row.role = 'owner'
        and owner_row.status = 'accepted'
    )
  );

-- Automatically grant the creator owner access on every new elderly profile.
create or replace function public.create_owner_access()
returns trigger as $$
begin
  insert into public.elderly_profile_access (elderly_id, user_id, role, status, invited_by)
  values (new.id, new.user_id, 'owner', 'accepted', new.user_id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists elderly_profiles_create_owner_access on public.elderly_profiles;
create trigger elderly_profiles_create_owner_access
  after insert on public.elderly_profiles
  for each row execute function public.create_owner_access();

-- Backfill owner access rows for elderly profiles created before this migration.
insert into public.elderly_profile_access (elderly_id, user_id, role, status, invited_by)
select p.id, p.user_id, 'owner', 'accepted', p.user_id
from public.elderly_profiles p
where not exists (
  select 1 from public.elderly_profile_access a
  where a.elderly_id = p.id and a.role = 'owner'
);

-- elderly_profiles: switch to access-table-based RLS.
drop policy if exists "Users can view their own elderly profiles" on public.elderly_profiles;
create policy "Members can view elderly profiles they have access to"
  on public.elderly_profiles for select
  using (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = elderly_profiles.id
        and a.user_id = auth.uid()
        and a.status = 'accepted'
    )
  );

drop policy if exists "Users can update their own elderly profiles" on public.elderly_profiles;
create policy "Owners can update elderly profiles"
  on public.elderly_profiles for update
  using (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = elderly_profiles.id
        and a.user_id = auth.uid()
        and a.role = 'owner'
        and a.status = 'accepted'
    )
  );

drop policy if exists "Users can delete their own elderly profiles" on public.elderly_profiles;
create policy "Owners can delete elderly profiles"
  on public.elderly_profiles for delete
  using (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = elderly_profiles.id
        and a.user_id = auth.uid()
        and a.role = 'owner'
        and a.status = 'accepted'
    )
  );

-- conversation_sessions: viewers and owners can read; only owners trigger calls.
drop policy if exists "Users can view sessions of their own elderly" on public.conversation_sessions;
create policy "Members can view sessions of their elderly"
  on public.conversation_sessions for select
  using (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = conversation_sessions.elderly_id
        and a.user_id = auth.uid()
        and a.status = 'accepted'
    )
  );

drop policy if exists "Users can insert sessions for their own elderly" on public.conversation_sessions;
create policy "Owners can insert sessions for their elderly"
  on public.conversation_sessions for insert
  with check (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = conversation_sessions.elderly_id
        and a.user_id = auth.uid()
        and a.role = 'owner'
        and a.status = 'accepted'
    )
  );

-- call_summaries: viewers and owners can read.
drop policy if exists "Users can view summaries of their own elderly" on public.call_summaries;
create policy "Members can view summaries of their elderly"
  on public.call_summaries for select
  using (
    exists (
      select 1 from public.conversation_sessions s
      join public.elderly_profile_access a on a.elderly_id = s.elderly_id
      where s.id = call_summaries.session_id
        and a.user_id = auth.uid()
        and a.status = 'accepted'
    )
  );

-- alerts: kept visible to the elderly's owner (alerts are recorded against the owner).
drop policy if exists "Users can view their own alerts" on public.alerts;
create policy "Owners can view alerts for their elderly"
  on public.alerts for select
  using (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = alerts.elderly_id
        and a.user_id = auth.uid()
        and a.role = 'owner'
        and a.status = 'accepted'
    )
  );

drop policy if exists "Users can update their own alerts" on public.alerts;
create policy "Owners can update alerts for their elderly"
  on public.alerts for update
  using (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = alerts.elderly_id
        and a.user_id = auth.uid()
        and a.role = 'owner'
        and a.status = 'accepted'
    )
  );

-- memories_media: any accepted member can view or add; delete stays uploader-or-owner.
drop policy if exists "Users can view photos of their own elderly" on public.memories_media;
create policy "Members can view photos of their elderly"
  on public.memories_media for select
  using (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = memories_media.elderly_id
        and a.user_id = auth.uid()
        and a.status = 'accepted'
    )
  );

drop policy if exists "Users can insert photos for their own elderly" on public.memories_media;
create policy "Owners can insert photos for their elderly"
  on public.memories_media for insert
  with check (
    exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = memories_media.elderly_id
        and a.user_id = auth.uid()
        and a.role = 'owner'
        and a.status = 'accepted'
    )
  );

drop policy if exists "Uploader or owner can delete photos" on public.memories_media;
create policy "Uploader or owner can delete photos"
  on public.memories_media for delete
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.elderly_profile_access a
      where a.elderly_id = memories_media.elderly_id
        and a.user_id = auth.uid()
        and a.role = 'owner'
        and a.status = 'accepted'
    )
  );
