alter table public.dealerships
  add column if not exists default_financing_apr_percent numeric(5, 2) not null default 0
    check (default_financing_apr_percent >= 0 and default_financing_apr_percent <= 100);

alter table public.sale_payment_plans
  add column if not exists apr_percent numeric(5, 2)
    check (apr_percent is null or (apr_percent >= 0 and apr_percent <= 100));
