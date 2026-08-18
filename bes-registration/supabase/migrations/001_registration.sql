create extension if not exists pgcrypto;

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  purchaser_name text not null,
  email text not null,
  ticket_type text not null check (ticket_type in ('standard','one_day','gala','student','online','speaker')),
  ticket_label text not null,
  ticket_description text not null,
  first_name text,
  last_name text,
  phone text,
  country text,
  specialty text,
  institution text,
  badge_name text,
  selected_day date,
  accessibility_needs text,
  language text check (language in ('en','es','uk')),
  status text not null default 'awaiting_form' check (status in ('awaiting_form','completed','verification_pending','approved','rejected')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gala_details (registration_id uuid primary key references public.registrations on delete cascade, attending boolean not null, dietary_preference text, allergies text);
create table public.speaker_profiles (registration_id uuid primary key references public.registrations on delete cascade, job_title text not null, presentation_title text not null, biography text, portrait_path text not null, promotional_consent boolean not null);
create table public.student_verifications (registration_id uuid primary key references public.registrations on delete cascade, document_path text not null, review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')), reviewed_at timestamptz);
create table public.online_access (registration_id uuid primary key references public.registrations on delete cascade, access_sent_at timestamptz);

alter table public.registrations enable row level security;
alter table public.gala_details enable row level security;
alter table public.speaker_profiles enable row level security;
alter table public.student_verifications enable row level security;
alter table public.online_access enable row level security;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('registration-private','registration-private',false,5242880,array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

