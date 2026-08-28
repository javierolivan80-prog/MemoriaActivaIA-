alter table public.subscriptions
  drop constraint if exists subscriptions_plan_type_check,
  drop constraint if exists subscriptions_calls_per_day_check,
  drop constraint if exists subscriptions_minutes_per_call_check;

alter table public.subscriptions
  add constraint subscriptions_plan_type_check check (plan_type in ('esencial', 'completo')),
  add constraint subscriptions_calls_per_day_check check (calls_per_day in (1, 2)),
  add constraint subscriptions_minutes_per_call_check check (minutes_per_call = 4);
