-- Run after schema-v2.sql in Supabase SQL Editor

alter table user_profiles
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists profile_visibility text not null default 'public'
    check (profile_visibility in ('public', 'private'));

create index if not exists idx_user_profiles_visibility
  on user_profiles (profile_visibility);