create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  sale_id uuid not null references public.vehicle_sales(id) on delete cascade,
  plan_id uuid references public.sale_payment_plans(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  payment_method text not null check (
    payment_method in ('cash', 'bank_transfer', 'check', 'gcash', 'other')
  ),
  reference_number text,
  notes text,
  status text not null default 'posted' check (status in ('posted', 'voided')),
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sale_payments_dealership_sale_idx
  on public.sale_payments (dealership_id, sale_id, paid_at desc);

create index if not exists sale_payments_dealership_plan_idx
  on public.sale_payments (dealership_id, plan_id);

create index if not exists sale_payments_dealership_status_idx
  on public.sale_payments (dealership_id, status);

drop trigger if exists sale_payments_set_updated_at on public.sale_payments;
create trigger sale_payments_set_updated_at
before update on public.sale_payments
for each row
execute function public.set_updated_at();

create table if not exists public.sale_payment_schedule_items (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  plan_id uuid not null references public.sale_payment_plans(id) on delete cascade,
  due_at timestamptz not null,
  amount_due numeric(12,2) not null check (amount_due > 0),
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'overdue', 'waived')
  ),
  paid_payment_id uuid references public.sale_payments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sale_payment_schedule_items_plan_due_idx
  on public.sale_payment_schedule_items (plan_id, due_at asc);

create index if not exists sale_payment_schedule_items_dealership_status_idx
  on public.sale_payment_schedule_items (dealership_id, status, due_at);

drop trigger if exists sale_payment_schedule_items_set_updated_at on public.sale_payment_schedule_items;
create trigger sale_payment_schedule_items_set_updated_at
before update on public.sale_payment_schedule_items
for each row
execute function public.set_updated_at();

alter table public.sale_payments enable row level security;
alter table public.sale_payment_schedule_items enable row level security;

drop policy if exists "sale_payments_select_member" on public.sale_payments;
create policy "sale_payments_select_member"
on public.sale_payments
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "sale_payments_insert_member" on public.sale_payments;
create policy "sale_payments_insert_member"
on public.sale_payments
for insert
to authenticated
with check (public.is_dealership_member(dealership_id));

drop policy if exists "sale_payments_update_admin" on public.sale_payments;
create policy "sale_payments_update_admin"
on public.sale_payments
for update
to authenticated
using (public.can_manage_sale_payment_plan(dealership_id))
with check (public.can_manage_sale_payment_plan(dealership_id));

drop policy if exists "sale_payment_schedule_items_select_member" on public.sale_payment_schedule_items;
create policy "sale_payment_schedule_items_select_member"
on public.sale_payment_schedule_items
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "sale_payment_schedule_items_insert_member" on public.sale_payment_schedule_items;
create policy "sale_payment_schedule_items_insert_member"
on public.sale_payment_schedule_items
for insert
to authenticated
with check (public.is_dealership_member(dealership_id));

drop policy if exists "sale_payment_schedule_items_update_member" on public.sale_payment_schedule_items;
create policy "sale_payment_schedule_items_update_member"
on public.sale_payment_schedule_items
for update
to authenticated
using (public.is_dealership_member(dealership_id))
with check (public.is_dealership_member(dealership_id));
