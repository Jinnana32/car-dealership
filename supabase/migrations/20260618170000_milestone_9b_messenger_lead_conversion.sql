alter table public.messenger_conversations
  add column if not exists sender_id text,
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null,
  add column if not exists vehicle_slug text,
  add column if not exists referral_ref text,
  add column if not exists last_message text,
  add column if not exists status text;

update public.messenger_conversations
set
  sender_id = coalesce(sender_id, sender_psid),
  vehicle_id = coalesce(
    vehicle_id,
    case
      when metadata ? 'resolved_vehicle_id'
        and nullif(metadata ->> 'resolved_vehicle_id', '') is not null
      then (metadata ->> 'resolved_vehicle_id')::uuid
      else null
    end
  ),
  vehicle_slug = coalesce(
    vehicle_slug,
    nullif(metadata ->> 'resolved_vehicle_slug', '')
  ),
  referral_ref = coalesce(
    referral_ref,
    nullif(metadata ->> 'referral_ref', '')
  ),
  last_message = coalesce(last_message, last_message_preview),
  status = coalesce(status, 'new')
where
  sender_id is null
  or vehicle_id is null
  or vehicle_slug is null
  or referral_ref is null
  or last_message is null
  or status is null;

alter table public.messenger_conversations
  alter column sender_id set not null,
  alter column status set default 'new';

alter table public.messenger_conversations
  drop constraint if exists messenger_conversations_status_check;

alter table public.messenger_conversations
  add constraint messenger_conversations_status_check check (
    status in ('new', 'reviewed', 'converted', 'ignored')
  );

create index if not exists messenger_conversations_dealership_status_idx
  on public.messenger_conversations (dealership_id, status);

create index if not exists messenger_conversations_dealership_vehicle_id_idx
  on public.messenger_conversations (dealership_id, vehicle_id);

drop policy if exists "messenger_conversations_update_internal_roles" on public.messenger_conversations;
create policy "messenger_conversations_update_internal_roles"
on public.messenger_conversations
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
