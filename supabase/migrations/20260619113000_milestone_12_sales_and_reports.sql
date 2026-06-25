create table if not exists public.vehicle_sales (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  sold_price numeric(12,2) not null,
  asking_price numeric(12,2),
  payment_type text check (
    payment_type in ('cash', 'financing', 'trade_in', 'other')
    or payment_type is null
  ),
  sold_at timestamptz not null default now(),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vehicle_sales_dealership_vehicle_unique_idx
  on public.vehicle_sales (dealership_id, vehicle_id);

create index if not exists vehicle_sales_dealership_sold_at_idx
  on public.vehicle_sales (dealership_id, sold_at desc);

create index if not exists vehicle_sales_dealership_vehicle_idx
  on public.vehicle_sales (dealership_id, vehicle_id);

create index if not exists vehicle_sales_dealership_customer_idx
  on public.vehicle_sales (dealership_id, customer_id);

create index if not exists vehicle_sales_dealership_inquiry_idx
  on public.vehicle_sales (dealership_id, inquiry_id);

create index if not exists vehicle_sales_created_by_idx
  on public.vehicle_sales (created_by);

drop trigger if exists vehicle_sales_set_updated_at on public.vehicle_sales;
create trigger vehicle_sales_set_updated_at
before update on public.vehicle_sales
for each row
execute function public.set_updated_at();

create or replace function public.can_manage_vehicle_sale(
  target_dealership_id uuid,
  related_inquiry_id uuid
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
      and profile.auth_user_id = auth.uid()
      and (
        membership.role = any(array['owner', 'admin'])
        or (
          membership.role = 'sales_agent'
          and related_inquiry_id is not null
          and exists (
            select 1
            from public.inquiries as inquiry
            where inquiry.id = related_inquiry_id
              and inquiry.dealership_id = target_dealership_id
              and inquiry.assigned_to = profile.id
          )
        )
      )
  );
$$;

alter table public.vehicle_sales enable row level security;

drop policy if exists "vehicle_sales_select_member" on public.vehicle_sales;
create policy "vehicle_sales_select_member"
on public.vehicle_sales
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "vehicle_sales_insert_internal" on public.vehicle_sales;
create policy "vehicle_sales_insert_internal"
on public.vehicle_sales
for insert
to authenticated
with check (public.can_manage_vehicle_sale(dealership_id, inquiry_id));

drop policy if exists "vehicle_sales_update_internal" on public.vehicle_sales;
create policy "vehicle_sales_update_internal"
on public.vehicle_sales
for update
to authenticated
using (public.can_manage_vehicle_sale(dealership_id, inquiry_id))
with check (public.can_manage_vehicle_sale(dealership_id, inquiry_id));
