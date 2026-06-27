-- Run after schema-v4-profile-security.sql

create table if not exists verification_codes (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  channel text not null check (channel in ('email', 'phone')),
  code_hash text not null,
  purpose text not null default '2fa',
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_verification_codes_lookup
  on verification_codes (destination, channel, purpose, expires_at desc);

alter table verification_codes enable row level security;

create policy "Service can manage verification codes"
  on verification_codes for all using (true) with check (true);