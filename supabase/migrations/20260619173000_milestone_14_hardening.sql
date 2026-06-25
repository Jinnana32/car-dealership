drop policy if exists "ai_chat_sessions_select_member" on public.ai_chat_sessions;
create policy "ai_chat_sessions_select_owner_admin"
on public.ai_chat_sessions
for select
to authenticated
using (public.has_dealership_role(dealership_id, array['owner', 'admin']));

drop policy if exists "ai_chat_sessions_insert_member" on public.ai_chat_sessions;
create policy "ai_chat_sessions_insert_owner_admin"
on public.ai_chat_sessions
for insert
to authenticated
with check (public.has_dealership_role(dealership_id, array['owner', 'admin']));

drop policy if exists "ai_chat_sessions_update_member" on public.ai_chat_sessions;
create policy "ai_chat_sessions_update_owner_admin"
on public.ai_chat_sessions
for update
to authenticated
using (public.has_dealership_role(dealership_id, array['owner', 'admin']))
with check (public.has_dealership_role(dealership_id, array['owner', 'admin']));

drop policy if exists "ai_chat_messages_select_member" on public.ai_chat_messages;
create policy "ai_chat_messages_select_owner_admin"
on public.ai_chat_messages
for select
to authenticated
using (public.has_dealership_role(dealership_id, array['owner', 'admin']));

drop policy if exists "ai_chat_messages_insert_member" on public.ai_chat_messages;
create policy "ai_chat_messages_insert_owner_admin"
on public.ai_chat_messages
for insert
to authenticated
with check (public.has_dealership_role(dealership_id, array['owner', 'admin']));
