create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  key text not null check (
    key in (
      'new',
      'contacted',
      'viewing_scheduled',
      'negotiation',
      'reserved',
      'won',
      'lost'
    )
  ),
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, key)
);

create index if not exists pipeline_stages_dealership_sort_idx
  on public.pipeline_stages (dealership_id, sort_order);

drop trigger if exists pipeline_stages_set_updated_at on public.pipeline_stages;
create trigger pipeline_stages_set_updated_at
before update on public.pipeline_stages
for each row
execute function public.set_updated_at();

create or replace function public.ensure_default_pipeline_stages(
  target_dealership_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pipeline_stages (
    dealership_id,
    key,
    label,
    description,
    sort_order,
    is_terminal
  )
  values
    (
      target_dealership_id,
      'new',
      'New',
      'Fresh inquiries waiting for first outreach.',
      0,
      false
    ),
    (
      target_dealership_id,
      'contacted',
      'Contacted',
      'A sales agent has started communication with the customer.',
      1,
      false
    ),
    (
      target_dealership_id,
      'viewing_scheduled',
      'Viewing Scheduled',
      'The customer has a scheduled viewing, test drive, or visit.',
      2,
      false
    ),
    (
      target_dealership_id,
      'negotiation',
      'Negotiation',
      'Pricing, financing, or terms are being discussed.',
      3,
      false
    ),
    (
      target_dealership_id,
      'reserved',
      'Reserved',
      'The inquiry is close to closing and the vehicle is being held.',
      4,
      false
    ),
    (
      target_dealership_id,
      'won',
      'Won',
      'The customer successfully closed this inquiry.',
      5,
      true
    ),
    (
      target_dealership_id,
      'lost',
      'Lost',
      'The inquiry did not convert.',
      6,
      true
    )
  on conflict (dealership_id, key) do nothing;
end;
$$;

select public.ensure_default_pipeline_stages(id)
from public.dealerships;

create or replace function public.handle_new_dealership_pipeline_stages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_default_pipeline_stages(new.id);

  return new;
end;
$$;

drop trigger if exists dealerships_after_insert_pipeline_stages on public.dealerships;
create trigger dealerships_after_insert_pipeline_stages
after insert on public.dealerships
for each row
execute function public.handle_new_dealership_pipeline_stages();

alter table public.pipeline_stages enable row level security;

drop policy if exists "pipeline_stages_select_member" on public.pipeline_stages;
create policy "pipeline_stages_select_member"
on public.pipeline_stages
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "pipeline_stages_insert_owner_admin" on public.pipeline_stages;
create policy "pipeline_stages_insert_owner_admin"
on public.pipeline_stages
for insert
to authenticated
with check (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
);

drop policy if exists "pipeline_stages_update_owner_admin" on public.pipeline_stages;
create policy "pipeline_stages_update_owner_admin"
on public.pipeline_stages
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

drop policy if exists "pipeline_stages_delete_owner_admin" on public.pipeline_stages;
create policy "pipeline_stages_delete_owner_admin"
on public.pipeline_stages
for delete
to authenticated
using (
  public.has_dealership_role(
    dealership_id,
    array['owner', 'admin']
  )
);

alter table public.inquiry_events
drop constraint if exists inquiry_events_event_type_check;

alter table public.inquiry_events
add constraint inquiry_events_event_type_check check (
  event_type in (
    'created',
    'status_changed',
    'note_added',
    'assigned',
    'follow_up_set',
    'customer_updated',
    'vehicle_linked',
    'marked_won',
    'marked_lost'
  )
);
