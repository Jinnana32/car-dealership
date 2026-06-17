-- Milestone 1 owner bootstrap
--
-- 1. Create the first auth user in the Supabase Dashboard:
--    Authentication -> Users -> Add user
-- 2. Replace the placeholder auth user id and dealership values below.
-- 3. Run this script in the Supabase SQL editor.

do $$
declare
  target_auth_user_id uuid := '00000000-0000-0000-0000-000000000000';
  target_dealership_id uuid;
  target_profile_id uuid;
begin
  insert into public.dealerships (
    name,
    slug,
    contact_email,
    contact_phone,
    facebook_page_url
  )
  values (
    'Sample Motors',
    'sample-motors',
    'owner@example.com',
    '+63 900 000 0000',
    'https://facebook.com/samplemotors'
  )
  on conflict (slug) do update
    set name = excluded.name,
        contact_email = excluded.contact_email,
        contact_phone = excluded.contact_phone,
        facebook_page_url = excluded.facebook_page_url,
        updated_at = timezone('utc', now())
  returning id into target_dealership_id;

  select profiles.id
  into target_profile_id
  from public.profiles
  where profiles.auth_user_id = target_auth_user_id;

  if target_profile_id is null then
    raise exception 'No profile exists for auth user id %.', target_auth_user_id;
  end if;

  insert into public.dealership_members (
    dealership_id,
    profile_id,
    role
  )
  values (
    target_dealership_id,
    target_profile_id,
    'owner'
  )
  on conflict (dealership_id, profile_id) do update
    set role = excluded.role;
end
$$;

