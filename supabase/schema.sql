create table if not exists public.trip_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trip jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trip_profiles enable row level security;

drop policy if exists "trip_profiles_select_own" on public.trip_profiles;
create policy "trip_profiles_select_own"
on public.trip_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "trip_profiles_insert_own" on public.trip_profiles;
create policy "trip_profiles_insert_own"
on public.trip_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "trip_profiles_update_own" on public.trip_profiles;
create policy "trip_profiles_update_own"
on public.trip_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  place jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

alter table public.saved_places enable row level security;

drop policy if exists "saved_places_select_own" on public.saved_places;
create policy "saved_places_select_own"
on public.saved_places
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "saved_places_insert_own" on public.saved_places;
create policy "saved_places_insert_own"
on public.saved_places
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_places_update_own" on public.saved_places;
create policy "saved_places_update_own"
on public.saved_places
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_places_delete_own" on public.saved_places;
create policy "saved_places_delete_own"
on public.saved_places
for delete
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.server_cache (
  kind text not null,
  cache_key text not null,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (kind, cache_key)
);

alter table public.server_cache enable row level security;

drop policy if exists "server_cache_service_only" on public.server_cache;
create policy "server_cache_service_only"
on public.server_cache
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete on public.trip_profiles to authenticated;
grant select, insert, update, delete on public.saved_places to authenticated;
grant all on public.server_cache to service_role;

revoke all on public.trip_profiles from anon;
revoke all on public.saved_places from anon;
revoke all on public.server_cache from anon, authenticated;
