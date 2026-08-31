-- The "familiar" plan covers up to 10 elderly profiles under one
-- subscription instead of the one-subscription-per-relative model every
-- earlier plan used. elderly_id on subscriptions becomes nullable: a
-- familiar subscription stores null there and lists its covered profiles
-- in subscription_members instead. The 10-profile cap is enforced in the
-- application layer (the attach API), not here — a plain check constraint
-- can't count sibling rows without a trigger, and the cap is a product
-- rule that may change, not a data-integrity invariant.

alter table public.subscriptions
  alter column elderly_id drop not null;

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_type_check,
  drop constraint if exists subscriptions_calls_per_day_check,
  drop constraint if exists subscriptions_minutes_per_call_check;

alter table public.subscriptions
  add constraint subscriptions_plan_type_check check (plan_type in ('esencial', 'completo', 'familiar')),
  add constraint subscriptions_calls_per_day_check check (calls_per_day in (1, 2)),
  add constraint subscriptions_minutes_per_call_check check (minutes_per_call in (4, 5)),
  add constraint subscriptions_elderly_id_matches_plan check (
    (plan_type = 'familiar' and elderly_id is null)
    or (plan_type <> 'familiar' and elderly_id is not null)
  );

create table if not exists public.subscription_members (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (subscription_id, elderly_id),
  -- one elderly profile can't be covered by two subscriptions at once,
  -- family or individual.
  unique (elderly_id)
);

create index if not exists subscription_members_subscription_id_idx
  on public.subscription_members (subscription_id);
create index if not exists subscription_members_elderly_id_idx
  on public.subscription_members (elderly_id);

alter table public.subscription_members enable row level security;

drop policy if exists "Users can view their own subscription members" on public.subscription_members;
create policy "Users can view their own subscription members"
  on public.subscription_members for select
  using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_members.subscription_id
      and s.user_id = auth.uid()
    )
  );
