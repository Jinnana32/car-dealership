alter table public.dealerships
  add column if not exists vehicle_catalog jsonb not null default '{}'::jsonb;

alter table public.vehicles
  add column if not exists engine_size text,
  add column if not exists engine_type text;
