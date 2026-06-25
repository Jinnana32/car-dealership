create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  stock_number text,
  slug text not null,
  title text not null,
  brand text not null,
  model text not null,
  variant text,
  year integer,
  price numeric(12, 2),
  mileage integer,
  fuel_type text,
  transmission text,
  body_type text,
  color text,
  plate_number text,
  vin text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'reserved', 'sold', 'archived')),
  availability text not null default 'available' check (availability in ('available', 'reserved', 'sold', 'unavailable')),
  featured_image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, slug)
);

create table if not exists public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  alt_text text,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_dealership_id_idx
  on public.vehicles (dealership_id);

create index if not exists vehicles_dealership_status_idx
  on public.vehicles (dealership_id, status);

create index if not exists vehicles_dealership_availability_idx
  on public.vehicles (dealership_id, availability);

create index if not exists vehicles_dealership_updated_at_idx
  on public.vehicles (dealership_id, updated_at desc);

create unique index if not exists vehicles_dealership_stock_number_unique
  on public.vehicles (dealership_id, stock_number)
  where stock_number is not null and btrim(stock_number) <> '';

create index if not exists vehicle_media_dealership_id_idx
  on public.vehicle_media (dealership_id);

create index if not exists vehicle_media_vehicle_id_idx
  on public.vehicle_media (vehicle_id);

create unique index if not exists vehicle_media_vehicle_featured_unique
  on public.vehicle_media (vehicle_id)
  where is_featured = true;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

create or replace function public.is_vehicle_in_dealership(
  target_vehicle_id uuid,
  target_dealership_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.vehicles as vehicle
    where vehicle.id = target_vehicle_id
      and vehicle.dealership_id = target_dealership_id
  );
$$;

create or replace function public.is_storage_dealership_member(
  object_name text
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
    where membership.dealership_id::text = split_part(object_name, '/', 1)
      and profile.auth_user_id = auth.uid()
  );
$$;

create or replace function public.has_storage_dealership_role(
  object_name text,
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
    where membership.dealership_id::text = split_part(object_name, '/', 1)
      and membership.role = any(allowed_roles)
      and profile.auth_user_id = auth.uid()
  );
$$;

alter table public.vehicles enable row level security;
alter table public.vehicle_media enable row level security;

drop policy if exists "vehicles_select_member" on public.vehicles;
create policy "vehicles_select_member"
on public.vehicles
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "vehicles_insert_owner_admin" on public.vehicles;
create policy "vehicles_insert_owner_admin"
on public.vehicles
for insert
to authenticated
with check (public.has_dealership_role(dealership_id, array['owner', 'admin']));

drop policy if exists "vehicles_update_owner_admin" on public.vehicles;
create policy "vehicles_update_owner_admin"
on public.vehicles
for update
to authenticated
using (public.has_dealership_role(dealership_id, array['owner', 'admin']))
with check (public.has_dealership_role(dealership_id, array['owner', 'admin']));

drop policy if exists "vehicle_media_select_member" on public.vehicle_media;
create policy "vehicle_media_select_member"
on public.vehicle_media
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "vehicle_media_insert_owner_admin" on public.vehicle_media;
create policy "vehicle_media_insert_owner_admin"
on public.vehicle_media
for insert
to authenticated
with check (
  public.has_dealership_role(dealership_id, array['owner', 'admin'])
  and public.is_vehicle_in_dealership(vehicle_id, dealership_id)
);

drop policy if exists "vehicle_media_update_owner_admin" on public.vehicle_media;
create policy "vehicle_media_update_owner_admin"
on public.vehicle_media
for update
to authenticated
using (
  public.has_dealership_role(dealership_id, array['owner', 'admin'])
  and public.is_vehicle_in_dealership(vehicle_id, dealership_id)
)
with check (
  public.has_dealership_role(dealership_id, array['owner', 'admin'])
  and public.is_vehicle_in_dealership(vehicle_id, dealership_id)
);

drop policy if exists "vehicle_media_delete_owner_admin" on public.vehicle_media;
create policy "vehicle_media_delete_owner_admin"
on public.vehicle_media
for delete
to authenticated
using (
  public.has_dealership_role(dealership_id, array['owner', 'admin'])
  and public.is_vehicle_in_dealership(vehicle_id, dealership_id)
);

insert into storage.buckets (id, name, public)
values ('vehicle-media', 'vehicle-media', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists "vehicle_media_storage_select_member" on storage.objects;
create policy "vehicle_media_storage_select_member"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vehicle-media'
  and public.is_storage_dealership_member(name)
);

drop policy if exists "vehicle_media_storage_insert_owner_admin" on storage.objects;
create policy "vehicle_media_storage_insert_owner_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vehicle-media'
  and public.has_storage_dealership_role(name, array['owner', 'admin'])
);

drop policy if exists "vehicle_media_storage_update_owner_admin" on storage.objects;
create policy "vehicle_media_storage_update_owner_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'vehicle-media'
  and public.has_storage_dealership_role(name, array['owner', 'admin'])
)
with check (
  bucket_id = 'vehicle-media'
  and public.has_storage_dealership_role(name, array['owner', 'admin'])
);

drop policy if exists "vehicle_media_storage_delete_owner_admin" on storage.objects;
create policy "vehicle_media_storage_delete_owner_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vehicle-media'
  and public.has_storage_dealership_role(name, array['owner', 'admin'])
);
