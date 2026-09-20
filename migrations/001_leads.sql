-- Still Yours — lead capture
-- Run once against your database:  psql "$DATABASE_URL" -f migrations/001_leads.sql

create extension if not exists "pgcrypto";

-- Owners asking for a visit (the /access form)
create table if not exists owner_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  name            text not null,
  email           text not null,
  phone           text,
  lives_in        text,

  address         text not null,
  property_type   text,
  preferred_date  date,

  service         text,            -- inspection | cleaning
  plan_id         text,
  size            text,
  rooms           jsonb not null default '{}'::jsonb,
  addons          jsonb not null default '{}'::jsonb,
  estimate_inr    integer,

  live_call       boolean not null default false,
  valuables_ack   boolean not null default false,

  source          text,            -- referrer / utm
  user_agent      text,
  status          text not null default 'new'   -- new | contacted | booked | dropped
);

create index if not exists owner_leads_created_idx on owner_leads (created_at desc);
create index if not exists owner_leads_status_idx  on owner_leads (status);
create unique index if not exists owner_leads_dedupe_idx
  on owner_leads (lower(email), lower(address));

-- People applying to inspect for us (the /access?role=inspector form)
create table if not exists inspector_applications (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  name            text not null,
  dob             date,
  phone           text not null,
  email           text not null,
  city            text not null,
  localities      text,
  occupation      text,
  experience      text,

  documents       jsonb not null default '{}'::jsonb,
  smartphone      text,
  mobile_data     text,
  travel          text,
  distance        text,
  visits_per_week text,
  commitment      text,
  availability    jsonb not null default '{}'::jsonb,

  ref_name        text,
  ref_phone       text,
  ref_relation    text,
  declarations    jsonb not null default '{}'::jsonb,

  source          text,
  user_agent      text,
  status          text not null default 'new'   -- new | screening | verified | rejected
);

create index if not exists inspector_apps_created_idx on inspector_applications (created_at desc);
create unique index if not exists inspector_apps_phone_idx on inspector_applications (phone);
