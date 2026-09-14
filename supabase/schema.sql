create extension if not exists pgcrypto;

create table if not exists public.resource_access (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null check (char_length(visitor_name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  resource_id text not null check (char_length(resource_id) between 1 and 160),
  resource_title text not null check (char_length(resource_title) between 1 and 300),
  resource_url text not null check (resource_url ~ '^https://(www\.)?(amazon\.com|researchgate\.net)/'),
  provider text not null check (provider in ('Amazon', 'ResearchGate')),
  privacy_consent boolean not null check (privacy_consent = true),
  marketing_consent boolean not null default false,
  consent_version text not null default '2026-09-14',
  submitted_at timestamptz not null default now()
);

alter table public.resource_access enable row level security;

drop policy if exists "anonymous visitors may submit access records" on public.resource_access;
create policy "anonymous visitors may submit access records"
on public.resource_access for insert
to anon
with check (
  privacy_consent = true
  and provider in ('Amazon', 'ResearchGate')
  and resource_url ~ '^https://(www\.)?(amazon\.com|researchgate\.net)/'
);

revoke all on public.resource_access from anon;
grant insert on public.resource_access to anon;

create index if not exists resource_access_submitted_at_idx on public.resource_access (submitted_at desc);
create index if not exists resource_access_email_idx on public.resource_access (lower(email));

comment on table public.resource_access is 'Consent-gated Amazon and ResearchGate resource access records. Review/export through authenticated Supabase Studio.';
