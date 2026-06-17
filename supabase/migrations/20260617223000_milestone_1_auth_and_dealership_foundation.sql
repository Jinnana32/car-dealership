create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.dealerships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  contact_email text,
  contact_phone text,
  facebook_page_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealership_members (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'sales_agent')),
  created_at timestamptz not null default now(),
  unique (dealership_id, profile_id)
);

create index if not exists dealership_members_dealership_id_idx
  on public.dealership_members (dealership_id);

create index if not exists dealership_members_profile_id_idx
  on public.dealership_members (profile_id);

drop trigger if exists dealerships_set_updated_at on public.dealerships;
create trigger dealerships_set_updated_at
before update on public.dealerships
for each row
execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    auth_user_id,
    full_name,
    email,
    avatar_url
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (auth_user_id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = excluded.email,
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists auth_user_profile_sync on auth.users;
create trigger auth_user_profile_sync
after insert or update on auth.users
for each row
execute function public.sync_profile_from_auth_user();

insert into public.profiles (auth_user_id, full_name, email, avatar_url)
select
  auth_users.id,
  coalesce(
    auth_users.raw_user_meta_data ->> 'full_name',
    auth_users.raw_user_meta_data ->> 'name'
  ),
  auth_users.email,
  auth_users.raw_user_meta_data ->> 'avatar_url'
from auth.users as auth_users
on conflict (auth_user_id) do update
  set full_name = coalesce(excluded.full_name, public.profiles.full_name),
      email = excluded.email,
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = timezone('utc', now());

create or replace function public.is_dealership_member(target_dealership_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.dealership_members as membership
    inner join public.profiles as profile
      on profile.id = membership.profile_id
    where membership.dealership_id = target_dealership_id
      and profile.auth_user_id = auth.uid()
  );
$$;

create or replace function public.has_dealership_role(
  target_dealership_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.dealership_members as membership
    inner join public.profiles as profile
      on profile.id = membership.profile_id
    where membership.dealership_id = target_dealership_id
      and membership.role = any(allowed_roles)
      and profile.auth_user_id = auth.uid()
  );
$$;

alter table public.dealerships enable row level security;
alter table public.profiles enable row level security;
alter table public.dealership_members enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "dealerships_select_member" on public.dealerships;
create policy "dealerships_select_member"
on public.dealerships
for select
to authenticated
using (public.is_dealership_member(id));

drop policy if exists "dealerships_update_owner_admin" on public.dealerships;
create policy "dealerships_update_owner_admin"
on public.dealerships
for update
to authenticated
using (public.has_dealership_role(id, array['owner', 'admin']))
with check (public.has_dealership_role(id, array['owner', 'admin']));

drop policy if exists "dealership_members_select_member" on public.dealership_members;
create policy "dealership_members_select_member"
on public.dealership_members
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "dealership_members_insert_owner_admin" on public.dealership_members;
create policy "dealership_members_insert_owner_admin"
on public.dealership_members
for insert
to authenticated
with check (public.has_dealership_role(dealership_id, array['owner', 'admin']));

drop policy if exists "dealership_members_update_owner_admin" on public.dealership_members;
create policy "dealership_members_update_owner_admin"
on public.dealership_members
for update
to authenticated
using (public.has_dealership_role(dealership_id, array['owner', 'admin']))
with check (public.has_dealership_role(dealership_id, array['owner', 'admin']));

drop policy if exists "dealership_members_delete_owner_admin" on public.dealership_members;
create policy "dealership_members_delete_owner_admin"
on public.dealership_members
for delete
to authenticated
using (public.has_dealership_role(dealership_id, array['owner', 'admin']));

