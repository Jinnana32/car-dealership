create table if not exists public.brochure_exports (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  title text,
  export_type text not null check (
    export_type in ('single_vehicle', 'multi_vehicle')
  ),
  vehicle_ids uuid[] not null,
  file_url text,
  storage_path text,
  status text not null default 'generated' check (
    status in ('pending', 'generated', 'failed')
  ),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists brochure_exports_dealership_created_at_idx
  on public.brochure_exports (dealership_id, created_at desc);

create index if not exists brochure_exports_dealership_export_type_idx
  on public.brochure_exports (dealership_id, export_type);

create index if not exists brochure_exports_dealership_status_idx
  on public.brochure_exports (dealership_id, status);

create index if not exists brochure_exports_generated_by_idx
  on public.brochure_exports (generated_by);

alter table public.brochure_exports enable row level security;

drop policy if exists "brochure_exports_select_member" on public.brochure_exports;
create policy "brochure_exports_select_member"
on public.brochure_exports
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "brochure_exports_insert_internal_roles" on public.brochure_exports;
create policy "brochure_exports_insert_internal_roles"
on public.brochure_exports
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin', 'sales_agent']
  )
  and (
    generated_by is null
    or exists (
      select 1
      from public.profiles
      where profiles.id = generated_by
        and profiles.auth_user_id = auth.uid()
    )
  )
);

drop policy if exists "brochure_exports_update_internal_roles" on public.brochure_exports;
create policy "brochure_exports_update_internal_roles"
on public.brochure_exports
for update
to authenticated
using (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin', 'sales_agent']
  )
)
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin', 'sales_agent']
  )
);

insert into storage.buckets (id, name, public)
values ('brochures', 'brochures', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists "brochures_storage_select_member" on storage.objects;
create policy "brochures_storage_select_member"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'brochures'
  and public.is_storage_dealership_member(name)
);

drop policy if exists "brochures_storage_insert_internal_roles" on storage.objects;
create policy "brochures_storage_insert_internal_roles"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'brochures'
  and public.has_storage_dealership_role(
    name,
    array['owner', 'admin', 'sales_agent']
  )
);

drop policy if exists "brochures_storage_update_internal_roles" on storage.objects;
create policy "brochures_storage_update_internal_roles"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'brochures'
  and public.has_storage_dealership_role(
    name,
    array['owner', 'admin', 'sales_agent']
  )
)
with check (
  bucket_id = 'brochures'
  and public.has_storage_dealership_role(
    name,
    array['owner', 'admin', 'sales_agent']
  )
);

drop policy if exists "brochures_storage_delete_internal_roles" on storage.objects;
create policy "brochures_storage_delete_internal_roles"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'brochures'
  and public.has_storage_dealership_role(
    name,
    array['owner', 'admin', 'sales_agent']
  )
);
