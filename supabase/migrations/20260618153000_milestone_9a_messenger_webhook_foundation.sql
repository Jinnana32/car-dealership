create table if not exists public.facebook_webhook_events (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  facebook_connection_id uuid references public.facebook_connections(id) on delete set null,
  event_source text not null default 'messenger' check (
    event_source in ('messenger', 'lead_form', 'unknown')
  ),
  event_key text not null,
  object_type text not null default 'page',
  page_id text,
  sender_psid text,
  recipient_id text,
  event_name text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (
    status in ('received', 'processed', 'ignored', 'error')
  ),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, event_key)
);

create table if not exists public.messenger_conversations (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  facebook_connection_id uuid references public.facebook_connections(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  page_id text not null,
  sender_psid text not null,
  last_message_at timestamptz,
  last_message_preview text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, page_id, sender_psid)
);

create table if not exists public.messenger_messages (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  conversation_id uuid not null references public.messenger_conversations(id) on delete cascade,
  facebook_connection_id uuid references public.facebook_connections(id) on delete set null,
  page_id text not null,
  sender_psid text not null,
  direction text not null default 'inbound' check (
    direction in ('inbound', 'outbound')
  ),
  facebook_message_id text not null,
  message_text text,
  raw_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, facebook_message_id)
);

create index if not exists facebook_webhook_events_dealership_created_at_idx
  on public.facebook_webhook_events (dealership_id, created_at desc);

create index if not exists facebook_webhook_events_dealership_status_idx
  on public.facebook_webhook_events (dealership_id, status);

create index if not exists facebook_webhook_events_dealership_page_id_idx
  on public.facebook_webhook_events (dealership_id, page_id);

create index if not exists messenger_conversations_dealership_last_message_at_idx
  on public.messenger_conversations (dealership_id, last_message_at desc nulls last);

create index if not exists messenger_conversations_dealership_sender_psid_idx
  on public.messenger_conversations (dealership_id, sender_psid);

create index if not exists messenger_messages_dealership_sent_at_idx
  on public.messenger_messages (dealership_id, sent_at desc);

create index if not exists messenger_messages_conversation_sent_at_idx
  on public.messenger_messages (conversation_id, sent_at desc);

create index if not exists messenger_messages_dealership_sender_psid_idx
  on public.messenger_messages (dealership_id, sender_psid);

drop trigger if exists facebook_webhook_events_set_updated_at on public.facebook_webhook_events;
create trigger facebook_webhook_events_set_updated_at
before update on public.facebook_webhook_events
for each row
execute function public.set_updated_at();

drop trigger if exists messenger_conversations_set_updated_at on public.messenger_conversations;
create trigger messenger_conversations_set_updated_at
before update on public.messenger_conversations
for each row
execute function public.set_updated_at();

drop trigger if exists messenger_messages_set_updated_at on public.messenger_messages;
create trigger messenger_messages_set_updated_at
before update on public.messenger_messages
for each row
execute function public.set_updated_at();

alter table public.facebook_webhook_events enable row level security;
alter table public.messenger_conversations enable row level security;
alter table public.messenger_messages enable row level security;

drop policy if exists "facebook_webhook_events_select_member" on public.facebook_webhook_events;
create policy "facebook_webhook_events_select_member"
on public.facebook_webhook_events
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "messenger_conversations_select_member" on public.messenger_conversations;
create policy "messenger_conversations_select_member"
on public.messenger_conversations
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "messenger_messages_select_member" on public.messenger_messages;
create policy "messenger_messages_select_member"
on public.messenger_messages
for select
to authenticated
using (public.is_dealership_member(dealership_id));
