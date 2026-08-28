create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  elderly_id uuid not null references public.elderly_profiles(id) on delete cascade,
  plan_type text not null check (plan_type in ('basic', 'care', 'premium')),
  calls_per_day integer not null check (calls_per_day in (1, 2, 3)),
  minutes_per_call integer not null check (minutes_per_call in (5, 10, 15)),
  status text not null default 'incomplete'
    check (status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'payment_failed')),
  stripe_customer_id text not null,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_elderly_id_idx on public.subscriptions (elderly_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);
