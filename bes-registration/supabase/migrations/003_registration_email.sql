alter table public.registrations
  add column if not exists registration_email_sent_at timestamptz;

comment on column public.registrations.registration_email_sent_at is
  'Set after the private post-payment registration link is accepted by the email provider.';
