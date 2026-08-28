create table if not exists public.memories_media (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  caption text not null,
  people_in_photo text,
  created_at timestamptz not null default now()
);

create index if not exists memories_media_elderly_id_idx on public.memories_media (elderly_id);
create index if not exists memories_media_elderly_id_created_at_idx on public.memories_media (elderly_id, created_at desc);

alter table public.memories_media enable row level security;

drop policy if exists "Users can view photos of their own elderly" on public.memories_media;
create policy "Users can view photos of their own elderly"
  on public.memories_media for select
  using (
    exists (
      select 1 from public.elderly_profiles p
      where p.id = memories_media.elderly_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert photos for their own elderly" on public.memories_media;
create policy "Users can insert photos for their own elderly"
  on public.memories_media for insert
  with check (
    exists (
      select 1 from public.elderly_profiles p
      where p.id = memories_media.elderly_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Uploader or owner can delete photos" on public.memories_media;
create policy "Uploader or owner can delete photos"
  on public.memories_media for delete
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.elderly_profiles p
      where p.id = memories_media.elderly_id
        and p.user_id = auth.uid()
    )
  );
