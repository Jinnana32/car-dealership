create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  first_name text,
  last_name text,
  full_name text not null,
  phone text,
  email text,
  facebook_profile_url text,
  source_type text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  source_type text not null check (
    source_type in (
      'facebook_lead_form',
      'facebook_messenger',
      'website_inquiry_form',
      'manual_entry',
      'phone_call',
      'walk_in',
      'referral',
      'facebook_comment',
      'viber',
      'whatsapp',
      'other'
    )
  ),
  source_detail text,
  source_reference_id text,
  original_message text,
  budget_range text,
  payment_preference text check (
    payment_preference in ('cash', 'financing', 'undecided')
    or payment_preference is null
  ),
  status text not null default 'new' check (
    status in (
      'new',
      'contacted',
      'viewing_scheduled',
      'negotiation',
      'reserved',
      'won',
      'lost'
    )
  ),
  assigned_to uuid references public.profiles(id),
  next_follow_up_at timestamptz,
  lost_reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiry_events (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'created',
      'status_changed',
      'note_added',
      'assigned',
      'follow_up_set',
      'customer_updated',
      'vehicle_linked'
    )
  ),
  old_status text,
  new_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lead_source_events (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  source_type text not null,
  source_detail text,
  event_name text not null,
  external_reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists customers_dealership_phone_idx
  on public.customers (dealership_id, phone);

create index if not exists customers_dealership_email_idx
  on public.customers (dealership_id, email);

create index if not exists customers_dealership_full_name_idx
  on public.customers (dealership_id, full_name);

create index if not exists inquiries_dealership_status_idx
  on public.inquiries (dealership_id, status);

create index if not exists inquiries_dealership_source_type_idx
  on public.inquiries (dealership_id, source_type);

create index if not exists inquiries_dealership_vehicle_id_idx
  on public.inquiries (dealership_id, vehicle_id);

create index if not exists inquiries_dealership_customer_id_idx
  on public.inquiries (dealership_id, customer_id);

create index if not exists inquiries_dealership_assigned_to_idx
  on public.inquiries (dealership_id, assigned_to);

create index if not exists inquiries_dealership_created_at_idx
  on public.inquiries (dealership_id, created_at desc);

create index if not exists inquiry_events_dealership_inquiry_id_idx
  on public.inquiry_events (dealership_id, inquiry_id);

create index if not exists inquiry_events_dealership_created_at_idx
  on public.inquiry_events (dealership_id, created_at desc);

create index if not exists lead_source_events_dealership_source_type_idx
  on public.lead_source_events (dealership_id, source_type);

create index if not exists lead_source_events_dealership_inquiry_id_idx
  on public.lead_source_events (dealership_id, inquiry_id);

create index if not exists lead_source_events_dealership_vehicle_id_idx
  on public.lead_source_events (dealership_id, vehicle_id);

create index if not exists lead_source_events_dealership_created_at_idx
  on public.lead_source_events (dealership_id, created_at desc);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
before update on public.inquiries
for each row
execute function public.set_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select profile.id
  from public.profiles as profile
  where profile.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_profile_in_dealership(
  target_profile_id uuid,
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
    from public.dealership_members as membership
    where membership.profile_id = target_profile_id
      and membership.dealership_id = target_dealership_id
  );
$$;

create or replace function public.is_customer_in_dealership(
  target_customer_id uuid,
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
    from public.customers as customer
    where customer.id = target_customer_id
      and customer.dealership_id = target_dealership_id
  );
$$;

create or replace function public.is_inquiry_in_dealership(
  target_inquiry_id uuid,
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
    from public.inquiries as inquiry
    where inquiry.id = target_inquiry_id
      and inquiry.dealership_id = target_dealership_id
  );
$$;

create or replace function public.can_manage_customer(
  target_customer_id uuid,
  target_dealership_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.has_dealership_role(target_dealership_id, array['owner', 'admin'])
    or exists (
      select 1
      from public.inquiries as inquiry
      where inquiry.customer_id = target_customer_id
        and inquiry.dealership_id = target_dealership_id
        and inquiry.assigned_to = public.current_profile_id()
    )
$$;

create or replace function public.can_manage_inquiry(
  target_inquiry_id uuid,
  target_dealership_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.has_dealership_role(target_dealership_id, array['owner', 'admin'])
    or exists (
      select 1
      from public.inquiries as inquiry
      where inquiry.id = target_inquiry_id
        and inquiry.dealership_id = target_dealership_id
        and inquiry.assigned_to = public.current_profile_id()
    )
$$;

create or replace function public.handle_new_inquiry_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inquiry_events (
    dealership_id,
    inquiry_id,
    event_type,
    metadata,
    created_by
  )
  values (
    new.dealership_id,
    new.id,
    'created',
    jsonb_build_object(
      'source_type',
      new.source_type,
      'status',
      new.status
    ),
    new.created_by
  );

  insert into public.lead_source_events (
    dealership_id,
    customer_id,
    inquiry_id,
    vehicle_id,
    source_type,
    source_detail,
    event_name,
    external_reference_id,
    metadata
  )
  values (
    new.dealership_id,
    new.customer_id,
    new.id,
    new.vehicle_id,
    new.source_type,
    new.source_detail,
    'inquiry_created',
    new.source_reference_id,
    jsonb_build_object(
      'status',
      new.status,
      'payment_preference',
      new.payment_preference
    )
  );

  return new;
end;
$$;

drop trigger if exists inquiries_after_insert_records on public.inquiries;
create trigger inquiries_after_insert_records
after insert on public.inquiries
for each row
execute function public.handle_new_inquiry_records();

alter table public.customers enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_events enable row level security;
alter table public.lead_source_events enable row level security;

drop policy if exists "customers_select_member" on public.customers;
create policy "customers_select_member"
on public.customers
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "customers_insert_internal_roles" on public.customers;
create policy "customers_insert_internal_roles"
on public.customers
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin', 'sales_agent']
  )
);

drop policy if exists "customers_update_manageable" on public.customers;
create policy "customers_update_manageable"
on public.customers
for update
to authenticated
using (public.can_manage_customer(id, dealership_id))
with check (public.can_manage_customer(id, dealership_id));

drop policy if exists "inquiries_select_member" on public.inquiries;
create policy "inquiries_select_member"
on public.inquiries
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "inquiries_insert_internal_roles" on public.inquiries;
create policy "inquiries_insert_internal_roles"
on public.inquiries
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin', 'sales_agent']
  )
  and public.is_customer_in_dealership(customer_id, dealership_id)
  and (
    vehicle_id is null
    or public.is_vehicle_in_dealership(vehicle_id, dealership_id)
  )
  and (
    assigned_to is null
    or public.is_profile_in_dealership(assigned_to, dealership_id)
  )
);

drop policy if exists "inquiries_update_manageable" on public.inquiries;
create policy "inquiries_update_manageable"
on public.inquiries
for update
to authenticated
using (public.can_manage_inquiry(id, dealership_id))
with check (
  public.can_manage_inquiry(id, dealership_id)
  and public.is_customer_in_dealership(customer_id, dealership_id)
  and (
    vehicle_id is null
    or public.is_vehicle_in_dealership(vehicle_id, dealership_id)
  )
  and (
    assigned_to is null
    or public.is_profile_in_dealership(assigned_to, dealership_id)
  )
);

drop policy if exists "inquiry_events_select_member" on public.inquiry_events;
create policy "inquiry_events_select_member"
on public.inquiry_events
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "inquiry_events_insert_manageable" on public.inquiry_events;
create policy "inquiry_events_insert_manageable"
on public.inquiry_events
for insert
to authenticated
with check (
  public.can_manage_inquiry(inquiry_id, dealership_id)
  and public.is_inquiry_in_dealership(inquiry_id, dealership_id)
);

drop policy if exists "lead_source_events_select_member" on public.lead_source_events;
create policy "lead_source_events_select_member"
on public.lead_source_events
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "lead_source_events_insert_internal_roles" on public.lead_source_events;
create policy "lead_source_events_insert_internal_roles"
on public.lead_source_events
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin', 'sales_agent']
  )
  and (
    customer_id is null
    or public.is_customer_in_dealership(customer_id, dealership_id)
  )
  and (
    inquiry_id is null
    or public.is_inquiry_in_dealership(inquiry_id, dealership_id)
  )
  and (
    vehicle_id is null
    or public.is_vehicle_in_dealership(vehicle_id, dealership_id)
  )
);
