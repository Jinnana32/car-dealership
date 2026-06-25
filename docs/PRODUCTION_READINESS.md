# Production Readiness

Use this checklist before handing the platform to the dealership for production use.

## Supabase and database

- [ ] Supabase project created
- [ ] All migrations applied from `supabase/migrations`
- [ ] RLS enabled on all private tables
- [ ] First dealership record created
- [ ] First owner/admin user created
- [ ] First dealership membership linked
- [ ] Pipeline stages created by migration and verified

## Storage

- [ ] `vehicle-media` bucket created
- [ ] `brochures` bucket created
- [ ] Storage policies verified for dealership-scoped access

## Environment variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `NEXT_PUBLIC_SITE_URL` set
- [ ] `META_GRAPH_API_VERSION` set
- [ ] `META_WEBHOOK_VERIFY_TOKEN` set
- [ ] `META_PAGE_ID` set
- [ ] `META_APP_SECRET` set if Facebook publishing or Lead Form sync is used
- [ ] `META_PAGE_ACCESS_TOKEN` set if Facebook publishing or Lead Form sync is used
- [ ] `OPENAI_API_KEY` set if AI Sales Analyst is enabled

See:

- [docs/ENVIRONMENT.md](/Users/tjcoyoca/Documents/car-dealership/docs/ENVIRONMENT.md)

## First admin setup

Follow:

- [docs/MILESTONE_1_SETUP.md](/Users/tjcoyoca/Documents/car-dealership/docs/MILESTONE_1_SETUP.md)

Confirm:

- [ ] First owner user can log in
- [ ] First owner user sees the admin dashboard
- [ ] Dealership settings can be updated
- [ ] Facebook settings can be saved

## Facebook and Meta

- [ ] Facebook Page details confirmed
- [ ] Messenger page identifier configured
- [ ] Page access token verified
- [ ] Webhook verify token configured in Meta
- [ ] Messenger webhook URL configured
- [ ] Facebook Lead Form webhook URL configured
- [ ] Facebook Page publishing test completed
- [ ] Messenger inbound event test completed
- [ ] Facebook Lead Form submission test completed

## Public site

- [ ] Public dealership homepage works
- [ ] Public vehicle listing works
- [ ] Public vehicle detail pages work
- [ ] Website inquiry submission works
- [ ] Messenger CTA works when configured
- [ ] Public site URL resolves correctly in production

## Sales operations

- [ ] Manual lead entry works
- [ ] Pipeline movement works
- [ ] Sale recording works
- [ ] Reports load with real data
- [ ] CSV exports download correctly
- [ ] Brochure generation works

## AI

- [ ] `/admin/ai` is intentionally enabled or intentionally left unconfigured
- [ ] If enabled, `OPENAI_API_KEY` is set
- [ ] If disabled, the setup-required state is acceptable to the client

## QA and deployment

- [ ] Manual QA completed using [docs/QA_CHECKLIST.md](/Users/tjcoyoca/Documents/car-dealership/docs/QA_CHECKLIST.md)
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] Error logs reviewed after staging smoke test
- [ ] Backup/export strategy documented for the client
- [ ] Client handoff guide shared

## Handoff references

- [docs/CLIENT_HANDOFF.md](/Users/tjcoyoca/Documents/car-dealership/docs/CLIENT_HANDOFF.md)
- [docs/QA_CHECKLIST.md](/Users/tjcoyoca/Documents/car-dealership/docs/QA_CHECKLIST.md)
- [docs/ENVIRONMENT.md](/Users/tjcoyoca/Documents/car-dealership/docs/ENVIRONMENT.md)
