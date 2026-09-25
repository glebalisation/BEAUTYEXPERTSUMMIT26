create table public.stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  checkout_session_id text,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

comment on table public.stripe_events is
  'Private idempotency ledger for verified Stripe webhooks. Service-role access only.';
