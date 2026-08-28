alter table public.elderly_profiles
  add column if not exists preferred_call_time time;
