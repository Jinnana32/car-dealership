create table if not exists public.sale_payment_plans (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  sale_id uuid not null references public.vehicle_sales(id) on delete cascade,
  plan_type text not null check (
    plan_type in ('cash', 'financing', 'trade_in', 'mixed')
  ),
  total_amount numeric(12,2) not null,
  down_payment_amount numeric(12,2) not null default 0,
  trade_in_amount numeric(12,2),
  financed_amount numeric(12,2),
  term_months integer,
  monthly_payment numeric(12,2),
  financier_name text,
  balance_remaining numeric(12,2) not null,
  status text not null check (
    status in ('pending', 'partially_paid', 'paid_in_full', 'overdue', 'cancelled')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sale_payment_plans_sale_id_unique_idx
  on public.sale_payment_plans (sale_id);

create index if not exists sale_payment_plans_dealership_status_idx
  on public.sale_payment_plans (dealership_id, status);

create index if not exists sale_payment_plans_dealership_sale_idx
  on public.sale_payment_plans (dealership_id, sale_id);

drop trigger if exists sale_payment_plans_set_updated_at on public.sale_payment_plans;
create trigger sale_payment_plans_set_updated_at
before update on public.sale_payment_plans
for each row
execute function public.set_updated_at();

create table if not exists public.sale_payment_plan_events (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  plan_id uuid not null references public.sale_payment_plans(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'updated')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists sale_payment_plan_events_plan_idx
  on public.sale_payment_plan_events (plan_id, created_at desc);

create index if not exists sale_payment_plan_events_dealership_idx
  on public.sale_payment_plan_events (dealership_id, created_at desc);

create or replace function public.can_manage_sale_payment_plan(
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
    inner join public.profiles as profile
      on profile.id = membership.profile_id
    where membership.dealership_id = target_dealership_id
      and profile.auth_user_id = auth.uid()
      and membership.role = any(array['owner', 'admin'])
  );
$$;

alter table public.sale_payment_plans enable row level security;
alter table public.sale_payment_plan_events enable row level security;

drop policy if exists "sale_payment_plans_select_member" on public.sale_payment_plans;
create policy "sale_payment_plans_select_member"
on public.sale_payment_plans
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "sale_payment_plans_insert_internal" on public.sale_payment_plans;
create policy "sale_payment_plans_insert_internal"
on public.sale_payment_plans
for insert
to authenticated
with check (public.is_dealership_member(dealership_id));

drop policy if exists "sale_payment_plans_update_admin" on public.sale_payment_plans;
create policy "sale_payment_plans_update_admin"
on public.sale_payment_plans
for update
to authenticated
using (public.can_manage_sale_payment_plan(dealership_id))
with check (public.can_manage_sale_payment_plan(dealership_id));

drop policy if exists "sale_payment_plan_events_select_member" on public.sale_payment_plan_events;
create policy "sale_payment_plan_events_select_member"
on public.sale_payment_plan_events
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "sale_payment_plan_events_insert_internal" on public.sale_payment_plan_events;
create policy "sale_payment_plan_events_insert_internal"
on public.sale_payment_plan_events
for insert
to authenticated
with check (public.is_dealership_member(dealership_id));

insert into public.sale_payment_plans (
  balance_remaining,
  dealership_id,
  down_payment_amount,
  plan_type,
  sale_id,
  status,
  total_amount
)
select
  case
    when coalesce(sale.payment_type, 'cash') in ('cash', 'other') then 0
    else sale.sold_price
  end,
  sale.dealership_id,
  case
    when coalesce(sale.payment_type, 'cash') in ('cash', 'other') then sale.sold_price
    else 0
  end,
  case sale.payment_type
    when 'financing' then 'financing'
    when 'trade_in' then 'trade_in'
    when 'other' then 'mixed'
    else 'cash'
  end,
  sale.id,
  case
    when coalesce(sale.payment_type, 'cash') in ('cash', 'other') then 'paid_in_full'
    else 'pending'
  end,
  sale.sold_price
from public.vehicle_sales as sale
where not exists (
  select 1
  from public.sale_payment_plans as plan
  where plan.sale_id = sale.id
);
