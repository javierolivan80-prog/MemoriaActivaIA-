-- 0007 introduced RLS policies that subquery elderly_profile_access from
-- within its own policies (and from every other table's policies), which
-- Postgres evaluates recursively through RLS again and fails with
-- "infinite recursion detected in policy for relation elderly_profile_access".
-- Security-definer helper functions bypass RLS for the membership check
-- itself, breaking the cycle.

create or replace function public.has_elderly_access(p_elderly_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.elderly_profile_access
    where elderly_id = p_elderly_id
      and user_id = auth.uid()
      and status = 'accepted'
  );
$$;

create or replace function public.is_elderly_owner(p_elderly_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.elderly_profile_access
    where elderly_id = p_elderly_id
      and user_id = auth.uid()
      and role = 'owner'
      and status = 'accepted'
  );
$$;

-- elderly_profile_access
drop policy if exists "Members can view their own access row or their elderly's roster" on public.elderly_profile_access;
create policy "Members can view their own access row or their elderly's roster"
  on public.elderly_profile_access for select
  using (
    user_id = auth.uid()
    or invited_email = (auth.jwt() ->> 'email')
    or public.is_elderly_owner(elderly_id)
  );

drop policy if exists "Owners can invite others" on public.elderly_profile_access;
create policy "Owners can invite others"
  on public.elderly_profile_access for insert
  with check (public.is_elderly_owner(elderly_id));

drop policy if exists "Owners can remove access" on public.elderly_profile_access;
create policy "Owners can remove access"
  on public.elderly_profile_access for delete
  using (role <> 'owner' and public.is_elderly_owner(elderly_id));

-- elderly_profiles
drop policy if exists "Members can view elderly profiles they have access to" on public.elderly_profiles;
create policy "Members can view elderly profiles they have access to"
  on public.elderly_profiles for select
  using (public.has_elderly_access(id));

drop policy if exists "Owners can update elderly profiles" on public.elderly_profiles;
create policy "Owners can update elderly profiles"
  on public.elderly_profiles for update
  using (public.is_elderly_owner(id));

drop policy if exists "Owners can delete elderly profiles" on public.elderly_profiles;
create policy "Owners can delete elderly profiles"
  on public.elderly_profiles for delete
  using (public.is_elderly_owner(id));

-- conversation_sessions
drop policy if exists "Members can view sessions of their elderly" on public.conversation_sessions;
create policy "Members can view sessions of their elderly"
  on public.conversation_sessions for select
  using (public.has_elderly_access(elderly_id));

drop policy if exists "Owners can insert sessions for their elderly" on public.conversation_sessions;
create policy "Owners can insert sessions for their elderly"
  on public.conversation_sessions for insert
  with check (public.is_elderly_owner(elderly_id));

-- call_summaries
drop policy if exists "Members can view summaries of their elderly" on public.call_summaries;
create policy "Members can view summaries of their elderly"
  on public.call_summaries for select
  using (
    exists (
      select 1 from public.conversation_sessions s
      where s.id = call_summaries.session_id
        and public.has_elderly_access(s.elderly_id)
    )
  );

-- alerts
drop policy if exists "Owners can view alerts for their elderly" on public.alerts;
create policy "Owners can view alerts for their elderly"
  on public.alerts for select
  using (public.is_elderly_owner(elderly_id));

drop policy if exists "Owners can update alerts for their elderly" on public.alerts;
create policy "Owners can update alerts for their elderly"
  on public.alerts for update
  using (public.is_elderly_owner(elderly_id));

-- memories_media
drop policy if exists "Members can view photos of their elderly" on public.memories_media;
create policy "Members can view photos of their elderly"
  on public.memories_media for select
  using (public.has_elderly_access(elderly_id));

drop policy if exists "Owners can insert photos for their elderly" on public.memories_media;
create policy "Owners can insert photos for their elderly"
  on public.memories_media for insert
  with check (public.is_elderly_owner(elderly_id));

drop policy if exists "Uploader or owner can delete photos" on public.memories_media;
create policy "Uploader or owner can delete photos"
  on public.memories_media for delete
  using (
    uploaded_by = auth.uid()
    or public.is_elderly_owner(elderly_id)
  );
