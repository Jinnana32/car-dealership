create table if not exists public.facebook_post_publications (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  facebook_connection_id uuid references public.facebook_connections(id) on delete set null,
  generated_content_id uuid references public.facebook_generated_content(id) on delete set null,
  facebook_page_id text,
  facebook_post_id text,
  facebook_photo_id text,
  publish_type text not null check (
    publish_type in ('text_link_post', 'photo_post')
  ),
  caption text not null,
  public_vehicle_url text not null,
  featured_image_url text,
  status text not null default 'pending' check (
    status in ('pending', 'published', 'failed')
  ),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  published_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.facebook_api_logs (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  action text not null,
  endpoint text,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  status_code integer,
  status text not null check (
    status in ('success', 'error')
  ),
  error_message text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists facebook_post_publications_dealership_vehicle_idx
  on public.facebook_post_publications (dealership_id, vehicle_id);

create index if not exists facebook_post_publications_dealership_status_idx
  on public.facebook_post_publications (dealership_id, status);

create index if not exists facebook_post_publications_dealership_published_at_idx
  on public.facebook_post_publications (dealership_id, published_at desc);

create index if not exists facebook_post_publications_facebook_post_id_idx
  on public.facebook_post_publications (facebook_post_id);

create index if not exists facebook_post_publications_facebook_photo_id_idx
  on public.facebook_post_publications (facebook_photo_id);

create index if not exists facebook_api_logs_dealership_created_at_idx
  on public.facebook_api_logs (dealership_id, created_at desc);

create index if not exists facebook_api_logs_dealership_status_idx
  on public.facebook_api_logs (dealership_id, status);

alter table public.facebook_post_publications enable row level security;
alter table public.facebook_api_logs enable row level security;

drop policy if exists "facebook_post_publications_select_member" on public.facebook_post_publications;
create policy "facebook_post_publications_select_member"
on public.facebook_post_publications
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "facebook_post_publications_insert_owner_admin" on public.facebook_post_publications;
create policy "facebook_post_publications_insert_owner_admin"
on public.facebook_post_publications
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
  and public.is_vehicle_in_dealership(vehicle_id, dealership_id)
  and (
    published_by is null
    or published_by = public.current_profile_id()
  )
);

drop policy if exists "facebook_post_publications_update_owner_admin" on public.facebook_post_publications;
create policy "facebook_post_publications_update_owner_admin"
on public.facebook_post_publications
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
  and public.is_vehicle_in_dealership(vehicle_id, dealership_id)
  and (
    published_by is null
    or published_by = public.current_profile_id()
  )
);

drop policy if exists "facebook_api_logs_select_member" on public.facebook_api_logs;
create policy "facebook_api_logs_select_member"
on public.facebook_api_logs
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "facebook_api_logs_insert_owner_admin" on public.facebook_api_logs;
create policy "facebook_api_logs_insert_owner_admin"
on public.facebook_api_logs
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
  and (
    created_by is null
    or created_by = public.current_profile_id()
  )
);
