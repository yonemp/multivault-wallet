-- Run once in Supabase Dashboard → SQL Editor if you see:
-- "Could not find the 'profile_visibility' column of 'user_profiles' in the schema cache"

alter table user_profiles
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists profile_visibility text not null default 'public'
    check (profile_visibility in ('public', 'private'));

create index if not exists idx_user_profiles_visibility
  on user_profiles (profile_visibility);

-- Refresh PostgREST schema cache (Supabase usually picks this up within ~1 min automatically)