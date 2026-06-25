create table if not exists public.facebook_connections (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  page_id text,
  page_name text,
  page_username text,
  facebook_page_url text,
  messenger_page_identifier text,
  ad_account_id text,
  pixel_id text,
  status text not null default 'not_connected' check (
    status in ('not_connected', 'configured', 'connected', 'error')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id)
);

create table if not exists public.facebook_generated_content (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  content_type text not null check (
    content_type in (
      'facebook_caption',
      'marketplace_description',
      'ad_primary_text',
      'ad_headline',
      'messenger_intro'
    )
  ),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists facebook_generated_content_dealership_vehicle_idx
  on public.facebook_generated_content (dealership_id, vehicle_id);

create index if not exists facebook_generated_content_dealership_content_type_idx
  on public.facebook_generated_content (dealership_id, content_type);

create index if not exists facebook_generated_content_dealership_created_at_idx
  on public.facebook_generated_content (dealership_id, created_at desc);

drop trigger if exists facebook_connections_set_updated_at on public.facebook_connections;
create trigger facebook_connections_set_updated_at
before update on public.facebook_connections
for each row
execute function public.set_updated_at();

alter table public.facebook_connections enable row level security;
alter table public.facebook_generated_content enable row level security;

drop policy if exists "facebook_connections_select_member" on public.facebook_connections;
create policy "facebook_connections_select_member"
on public.facebook_connections
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "facebook_connections_insert_owner_admin" on public.facebook_connections;
create policy "facebook_connections_insert_owner_admin"
on public.facebook_connections
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
);

drop policy if exists "facebook_connections_update_owner_admin" on public.facebook_connections;
create policy "facebook_connections_update_owner_admin"
on public.facebook_connections
for update
to authenticated
using (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
)
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
);

drop policy if exists "facebook_connections_delete_owner_admin" on public.facebook_connections;
create policy "facebook_connections_delete_owner_admin"
on public.facebook_connections
for delete
to authenticated
using (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
);

drop policy if exists "facebook_generated_content_select_member" on public.facebook_generated_content;
create policy "facebook_generated_content_select_member"
on public.facebook_generated_content
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "facebook_generated_content_insert_internal_roles" on public.facebook_generated_content;
create policy "facebook_generated_content_insert_internal_roles"
on public.facebook_generated_content
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin', 'sales_agent']
  )
  and public.is_vehicle_in_dealership(vehicle_id, dealership_id)
  and (
    created_by is null
    or created_by = public.current_profile_id()
  )
);
