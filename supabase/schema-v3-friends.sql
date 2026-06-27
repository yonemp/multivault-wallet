-- Run after schema-v2.sql in Supabase SQL Editor

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_username text not null,
  to_username text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (from_username, to_username)
);

create index if not exists idx_friend_requests_to on friend_requests (to_username, status);
create index if not exists idx_friend_requests_from on friend_requests (from_username, status);

alter table friend_requests enable row level security;

create policy "Anyone can read friend requests"
  on friend_requests for select using (true);

create policy "Anyone can create friend requests"
  on friend_requests for insert with check (true);

create policy "Anyone can update friend requests"
  on friend_requests for update using (true);