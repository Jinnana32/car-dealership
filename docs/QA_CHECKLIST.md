# QA Checklist

Use this checklist before client review or production deployment.

## Auth

- [ ] `/login` loads
- [ ] Invalid login shows a friendly error
- [ ] Valid login redirects to `/admin/dashboard`
- [ ] Logout returns the user to `/login`
- [ ] Unauthenticated `/admin/*` access redirects to `/login`
- [ ] Authenticated users without dealership membership see an access-blocked state

## Vehicle inventory

- [ ] Vehicles list loads
- [ ] Vehicle empty state works
- [ ] New vehicle creation works
- [ ] Vehicle editing works
- [ ] Vehicle photo upload works
- [ ] Featured image selection works
- [ ] Status and availability changes work
- [ ] Archiving works
- [ ] Sold vehicles remain in admin inventory

## Public website

- [ ] `/{dealerSlug}` loads
- [ ] `/{dealerSlug}/vehicles` loads
- [ ] `/{dealerSlug}/vehicles/{vehicleSlug}` loads
- [ ] Only published and available vehicles show publicly
- [ ] Draft vehicles are hidden publicly
- [ ] Reserved vehicles are hidden publicly
- [ ] Sold vehicles are hidden publicly
- [ ] Archived vehicles are hidden publicly
- [ ] Public pages do not expose VIN, plate number, or internal metadata
- [ ] Mobile layout is usable

## Website inquiry

- [ ] Public inquiry form submits successfully
- [ ] Validation errors appear when required fields are missing
- [ ] Duplicate customers are reused by phone/email where expected
- [ ] Inquiry appears in `/admin/inquiries`
- [ ] Inquiry appears in `/admin/pipeline`

## Manual lead

- [ ] `/admin/leads/new` loads
- [ ] Manual lead creation works
- [ ] Duplicate detection works by phone
- [ ] Duplicate detection works by email
- [ ] Duplicate detection works by name

## Pipeline

- [ ] `/admin/pipeline` loads
- [ ] Inquiry can move through statuses
- [ ] Notes can be added
- [ ] Follow-up date can be set
- [ ] Lost reason is required when marking lost
- [ ] Won flow works

## Facebook content

- [ ] `/admin/facebook` loads
- [ ] `/admin/facebook/settings` saves
- [ ] Generated content can be created
- [ ] Generated content history loads
- [ ] Messenger link generation works when configured

## Facebook Page publishing

- [ ] Vehicle Facebook readiness appears
- [ ] Missing env setup shows a friendly error
- [ ] Publishing requires explicit confirmation
- [ ] Publish history is visible
- [ ] No raw token appears in the UI or logs

## Messenger webhook and conversion

- [ ] Messenger webhook verification works
- [ ] Messenger inbound messages are stored
- [ ] Messenger conversations appear in `/admin/facebook/messenger`
- [ ] Conversation detail page loads
- [ ] Manual conversion to inquiry works
- [ ] Messenger clicks do not create inquiries by themselves

## Facebook Lead Form webhook

- [ ] Leadgen webhook verification works
- [ ] Leadgen webhook stores raw event
- [ ] Duplicate `leadgen_id` values do not create duplicate inquiries
- [ ] Lead records appear in `/admin/facebook/leads`
- [ ] Imported leads appear in `/admin/inquiries`
- [ ] Imported leads appear in `/admin/pipeline`

## Brochures

- [ ] `/admin/brochures` loads
- [ ] Single-vehicle brochure generation works
- [ ] Multi-vehicle brochure generation works
- [ ] PDF download works
- [ ] PDFs do not expose VIN or plate number
- [ ] Missing image/logo/site URL does not crash brochure generation

## Reports

- [ ] `/admin/reports` loads
- [ ] Sales report loads
- [ ] Inventory report loads
- [ ] Inquiry report loads
- [ ] Lead source report loads
- [ ] Pipeline report loads
- [ ] CSV export works for every report
- [ ] Filters behave as expected

## AI Sales Analyst

- [ ] `/admin/ai` loads for owner/admin
- [ ] Missing `OPENAI_API_KEY` shows setup-required state
- [ ] Suggested questions render
- [ ] AI answers return when configured
- [ ] AI does not mutate records
- [ ] AI does not publish to Facebook
- [ ] AI does not send messages

## Permissions and RLS

- [ ] Sales agent cannot access owner/admin-only pages such as Reports and AI
- [ ] Cross-dealership data is blocked
- [ ] Public users cannot read customers, inquiries, sales, Facebook logs, or AI chat history
- [ ] Service-role-only behavior stays server-side

## Responsive layout

- [ ] Login page works on mobile width
- [ ] Public vehicle listing works on mobile width
- [ ] Public vehicle detail works on mobile width
- [ ] Admin sidebar/top nav still work on tablet/mobile width

## Production deployment

- [ ] All migrations applied
- [ ] Storage buckets created
- [ ] Env variables set
- [ ] Webhooks configured in Meta
- [ ] First owner/admin user created
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
