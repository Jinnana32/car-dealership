alter table public.vehicles
  add column if not exists financing_down_payment_percent numeric(5, 2);
