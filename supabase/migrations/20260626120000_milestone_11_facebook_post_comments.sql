alter table public.facebook_webhook_events
  drop constraint if exists facebook_webhook_events_event_source_check;

alter table public.facebook_webhook_events
  add constraint facebook_webhook_events_event_source_check
  check (event_source in ('messenger', 'lead_form', 'comment', 'unknown'));

create table if not exists public.facebook_post_comments (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  facebook_connection_id uuid references public.facebook_connections(id) on delete set null,
  publication_id uuid references public.facebook_post_publications(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  page_id text not null,
  facebook_post_id text not null,
  facebook_comment_id text not null,
  parent_comment_id text,
  author_facebook_id text,
  author_name text not null,
  message text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (
    status in ('received', 'processed', 'duplicate', 'ignored', 'failed')
  ),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, facebook_comment_id)
);

create index if not exists facebook_post_comments_dealership_created_at_idx
  on public.facebook_post_comments (dealership_id, created_at desc);

create index if not exists facebook_post_comments_dealership_status_idx
  on public.facebook_post_comments (dealership_id, status);

create index if not exists facebook_post_comments_dealership_post_idx
  on public.facebook_post_comments (dealership_id, facebook_post_id);

create index if not exists facebook_post_comments_dealership_author_idx
  on public.facebook_post_comments (dealership_id, author_facebook_id);

create index if not exists facebook_post_comments_customer_id_idx
  on public.facebook_post_comments (customer_id);

create index if not exists facebook_post_comments_inquiry_id_idx
  on public.facebook_post_comments (inquiry_id);

drop trigger if exists facebook_post_comments_set_updated_at on public.facebook_post_comments;
create trigger facebook_post_comments_set_updated_at
before update on public.facebook_post_comments
for each row
execute function public.set_updated_at();

alter table public.facebook_post_comments enable row level security;

drop policy if exists "facebook_post_comments_select_member" on public.facebook_post_comments;
create policy "facebook_post_comments_select_member"
on public.facebook_post_comments
for select
to authenticated
using (public.is_dealership_member(dealership_id));
