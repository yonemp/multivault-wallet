-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists connected_wallets (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  chain text not null check (chain in ('ethereum', 'solana', 'polygon', 'bsc')),
  wallet_type text not null check (wallet_type in ('created', 'imported', 'metamask', 'phantom', 'trust')),
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (address, chain)
);

create index if not exists idx_connected_wallets_address on connected_wallets (address);

alter table connected_wallets enable row level security;

create policy "Anyone can read wallets"
  on connected_wallets for select
  using (true);

create policy "Anyone can insert wallets"
  on connected_wallets for insert
  with check (true);

create policy "Anyone can update wallets"
  on connected_wallets for update
  using (true);