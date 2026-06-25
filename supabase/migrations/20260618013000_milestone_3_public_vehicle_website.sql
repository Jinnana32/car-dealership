create or replace function public.is_public_vehicle(target_vehicle_id uuid)
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
      and vehicle.status = 'published'
      and vehicle.availability = 'available'
  );
$$;

drop policy if exists "dealerships_select_public" on public.dealerships;
create policy "dealerships_select_public"
on public.dealerships
for select
to public
using (true);

drop policy if exists "vehicles_select_public_published_available" on public.vehicles;
create policy "vehicles_select_public_published_available"
on public.vehicles
for select
to public
using (
  status = 'published'
  and availability = 'available'
);

drop policy if exists "vehicle_media_select_public_published_available" on public.vehicle_media;
create policy "vehicle_media_select_public_published_available"
on public.vehicle_media
for select
to public
using (public.is_public_vehicle(vehicle_id));
