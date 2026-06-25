alter table public.dealerships
  add column if not exists default_financing_headline text,
  add column if not exists default_post_location_tag text,
  add column if not exists default_sale_inclusions text[] not null default '{}';

alter table public.vehicles
  add column if not exists is_price_negotiable boolean not null default false,
  add column if not exists show_cash_price_in_posts boolean not null default true,
  add column if not exists financing_enabled boolean not null default false,
  add column if not exists financing_headline text,
  add column if not exists financing_down_payment numeric(12, 2),
  add column if not exists financing_down_payment_label text,
  add column if not exists financing_notes text,
  add column if not exists financing_display_style text not null default 'detailed'
    check (financing_display_style in ('detailed', 'compact', 'headline_only')),
  add column if not exists financing_monthly_terms jsonb not null default '[]'::jsonb,
  add column if not exists condition_summary text,
  add column if not exists engine text,
  add column if not exists highlights text[] not null default '{}',
  add column if not exists use_cases text[] not null default '{}',
  add column if not exists sale_inclusions text[] not null default '{}',
  add column if not exists post_location_tag text;
