-- Run after schema.sql in Supabase SQL Editor

-- Wallet moderation (app-level flag — does not freeze on-chain funds)
alter table connected_wallets
  add column if not exists is_frozen boolean default false,
  add column if not exists frozen_reason text,
  add column if not exists frozen_at timestamptz,
  add column if not exists frozen_by text;

-- Support tickets
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  wallet_address text,
  chain text,
  subject text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  admin_reply text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_support_tickets_status on support_tickets (status);

alter table support_tickets enable row level security;

create policy "Anyone can read tickets"
  on support_tickets for select using (true);

create policy "Anyone can create tickets"
  on support_tickets for insert with check (true);

create policy "Anyone can update tickets"
  on support_tickets for update using (true);

-- User profiles (optional display info, keyed by primary wallet address)
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  primary_address text not null unique,
  display_name text,
  avatar_color text default '#2f6fed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Anyone can read profiles"
  on user_profiles for select using (true);

create policy "Anyone can upsert profiles"
  on user_profiles for insert with check (true);

create policy "Anyone can update profiles"
  on user_profiles for update using (true);