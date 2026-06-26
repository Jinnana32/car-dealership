alter table public.customers
  add column if not exists fb_customer_id text;

create index if not exists customers_dealership_fb_customer_id_idx
  on public.customers (dealership_id, fb_customer_id)
  where fb_customer_id is not null;

alter table public.facebook_post_publications
  add column if not exists comments_last_synced_at timestamptz;

create index if not exists facebook_post_publications_comments_sync_idx
  on public.facebook_post_publications (dealership_id, comments_last_synced_at nulls first)
  where status = 'published' and facebook_post_id is not null;
