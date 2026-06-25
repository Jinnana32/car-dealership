create table if not exists public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  title text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  session_id uuid not null references public.ai_chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_sessions_dealership_updated_at_idx
  on public.ai_chat_sessions (dealership_id, updated_at desc);

create index if not exists ai_chat_sessions_created_by_idx
  on public.ai_chat_sessions (created_by);

create index if not exists ai_chat_messages_dealership_session_idx
  on public.ai_chat_messages (dealership_id, session_id, created_at asc);

drop trigger if exists ai_chat_sessions_set_updated_at on public.ai_chat_sessions;
create trigger ai_chat_sessions_set_updated_at
before update on public.ai_chat_sessions
for each row
execute function public.set_updated_at();

alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;

drop policy if exists "ai_chat_sessions_select_member" on public.ai_chat_sessions;
create policy "ai_chat_sessions_select_member"
on public.ai_chat_sessions
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "ai_chat_sessions_insert_member" on public.ai_chat_sessions;
create policy "ai_chat_sessions_insert_member"
on public.ai_chat_sessions
for insert
to authenticated
with check (public.is_dealership_member(dealership_id));

drop policy if exists "ai_chat_sessions_update_member" on public.ai_chat_sessions;
create policy "ai_chat_sessions_update_member"
on public.ai_chat_sessions
for update
to authenticated
using (public.is_dealership_member(dealership_id))
with check (public.is_dealership_member(dealership_id));

drop policy if exists "ai_chat_messages_select_member" on public.ai_chat_messages;
create policy "ai_chat_messages_select_member"
on public.ai_chat_messages
for select
to authenticated
using (public.is_dealership_member(dealership_id));

drop policy if exists "ai_chat_messages_insert_member" on public.ai_chat_messages;
create policy "ai_chat_messages_insert_member"
on public.ai_chat_messages
for insert
to authenticated
with check (public.is_dealership_member(dealership_id));
