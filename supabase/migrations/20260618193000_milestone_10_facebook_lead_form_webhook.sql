create table if not exists public.facebook_leads (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  facebook_connection_id uuid references public.facebook_connections(id) on delete set null,
  leadgen_id text not null,
  form_id text,
  form_name text,
  page_id text,
  ad_id text,
  ad_name text,
  adset_id text,
  adset_name text,
  campaign_id text,
  campaign_name text,
  customer_id uuid references public.customers(id) on delete set null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  field_data jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (
    status in ('received', 'processed', 'duplicate', 'failed')
  ),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (dealership_id, leadgen_id)
);

create table if not exists public.facebook_lead_form_mappings (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  form_id text not null,
  form_name text,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  field_map jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, form_id)
);

create index if not exists facebook_leads_dealership_leadgen_idx
  on public.facebook_leads (dealership_id, leadgen_id);

create index if not exists facebook_leads_dealership_status_idx
  on public.facebook_leads (dealership_id, status);

create index if not exists facebook_leads_dealership_form_idx
  on public.facebook_leads (dealership_id, form_id);

create index if not exists facebook_leads_dealership_created_at_idx
  on public.facebook_leads (dealership_id, created_at desc);

create index if not exists facebook_leads_customer_id_idx
  on public.facebook_leads (customer_id);

create index if not exists facebook_leads_inquiry_id_idx
  on public.facebook_leads (inquiry_id);

create index if not exists facebook_lead_form_mappings_dealership_active_idx
  on public.facebook_lead_form_mappings (dealership_id, is_active);

create index if not exists facebook_lead_form_mappings_dealership_vehicle_idx
  on public.facebook_lead_form_mappings (dealership_id, vehicle_id);

drop trigger if exists facebook_lead_form_mappings_set_updated_at on public.facebook_lead_form_mappings;
create trigger facebook_lead_form_mappings_set_updated_at
before update on public.facebook_lead_form_mappings
for each row
execute function public.set_updated_at();

alter table public.facebook_leads enable row level security;
alter table public.facebook_lead_form_mappings enable row level security;

drop policy if exists "facebook_leads_select_member" on public.facebook_leads;
create policy "facebook_leads_select_member"
on public.facebook_leads
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "facebook_lead_form_mappings_select_member" on public.facebook_lead_form_mappings;
create policy "facebook_lead_form_mappings_select_member"
on public.facebook_lead_form_mappings
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "facebook_lead_form_mappings_insert_manage" on public.facebook_lead_form_mappings;
create policy "facebook_lead_form_mappings_insert_manage"
on public.facebook_lead_form_mappings
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
  and (
    vehicle_id is null
    or public.is_vehicle_in_dealership(vehicle_id, dealership_id)
  )
);

drop policy if exists "facebook_lead_form_mappings_update_manage" on public.facebook_lead_form_mappings;
create policy "facebook_lead_form_mappings_update_manage"
on public.facebook_lead_form_mappings
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
  and (
    vehicle_id is null
    or public.is_vehicle_in_dealership(vehicle_id, dealership_id)
  )
);

drop policy if exists "facebook_lead_form_mappings_delete_manage" on public.facebook_lead_form_mappings;
create policy "facebook_lead_form_mappings_delete_manage"
on public.facebook_lead_form_mappings
for delete
to authenticated
using (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
);
