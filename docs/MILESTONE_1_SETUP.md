# Milestone 1 Setup

Milestone 1 adds Supabase Auth, dealership records, profiles, dealership membership, RLS, and protected admin routes.

## Environment

Add these values to `.env.local`:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Local owner bootstrap

1. Run the Milestone 1 migration in Supabase.
2. Open the Supabase Dashboard.
3. Go to `Authentication -> Users`.
4. Create the first user manually with email and password.
5. Copy that user's UUID from Supabase Auth.
6. Open [supabase/seeds/milestone_1_owner_setup.sql](/Users/tjcoyoca/Documents/car-dealership/supabase/seeds/milestone_1_owner_setup.sql).
7. Replace:
   - `target_auth_user_id`
   - dealership name
   - dealership slug
   - contact values
8. Run the SQL in the Supabase SQL editor.

What this does:

- Creates the dealership record if it does not already exist
- Uses the auto-created `profiles` row tied to `auth.users`
- Creates the `dealership_members` link with role `owner`

## Auth flow

- `/login` signs in an existing Supabase Auth user
- `/admin/dashboard` requires authentication
- `/admin/settings` requires authentication
- Users without dealership membership see an access-required state

## RLS verification

After creating at least two users:

1. Sign in as the owner.
2. Confirm `/admin/dashboard` loads and shows the dealership name.
3. Confirm `/admin/settings` allows dealership updates.
4. Create a second authenticated user without a `dealership_members` row.
5. Sign in as that second user.
6. Confirm `/admin/dashboard` does not show admin content and instead shows the access-required state.
7. Add the second user to the dealership as `sales_agent`.
8. Sign in again as that second user.
9. Confirm `/admin/dashboard` loads.
10. Confirm `/admin/settings` shows the permission warning for dealership settings.

## Manual test checklist

1. Login works from `/login`.
2. Logout works from the admin top bar.
3. Unauthenticated access to `/admin/dashboard` redirects to `/login`.
4. Authenticated dealership members can open `/admin/dashboard`.
5. `/admin/settings` loads for authenticated dealership members.
6. Sales agents cannot update dealership settings.
7. A user without a membership cannot access dealership admin content.
8. `pnpm lint` passes.
9. `pnpm typecheck` passes.
10. `pnpm build` passes.

