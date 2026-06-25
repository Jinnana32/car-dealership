# Environment Variables

This document lists the environment variables used by the dealership platform and explains which features depend on each one.

## Security Rule

Never expose these values to the browser:

- `SUPABASE_SERVICE_ROLE_KEY`
- `META_APP_SECRET`
- `META_PAGE_ACCESS_TOKEN`
- `OPENAI_API_KEY`

Only `NEXT_PUBLIC_*` variables are client-safe.

## Variables

| Variable | Required | Scope | Used by |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client-safe | Supabase browser and server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client-safe | Supabase browser and server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only | Admin queries, webhooks, signed storage access, PDF generation, reports, AI context aggregation |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Client-safe | Public vehicle URLs, Facebook publishing links, brochure QR codes, SEO metadata |
| `META_APP_ID` | Optional for current build | Server-only | Reserved for deeper Meta app setup and future debugging/handoff |
| `META_APP_SECRET` | Required for Facebook publishing/Lead Forms | Server-only | Generates `appsecret_proof` for server-side Meta Graph API calls |
| `META_GRAPH_API_VERSION` | Required for Facebook publishing/webhooks | Server-only | Facebook Page publishing and Lead Form detail fetch |
| `META_WEBHOOK_VERIFY_TOKEN` | Required for Meta webhooks | Server-only | Messenger webhook verification and Facebook Lead Form webhook verification |
| `META_PAGE_ID` | Recommended | Server-only | Facebook Page publishing default page resolution |
| `META_PAGE_ACCESS_TOKEN` | Required for Facebook publishing/Lead Forms | Server-only | Facebook Page publishing and Facebook Lead detail fetch |
| `META_AD_ACCOUNT_ID` | Optional for current build | Server-only | Reserved for future ad tooling and client handoff reference |
| `META_PIXEL_ID` | Optional for current build | Server-only | Reserved for future tracking/ad tooling and client handoff reference |
| `OPENAI_API_KEY` | Optional | Server-only | AI Sales Analyst |

## Feature Notes

### Core app

The app cannot run correctly without:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Public site and brochures

`NEXT_PUBLIC_SITE_URL` should be set in production. If it is missing:

- Public pages still work
- Facebook publishing readiness is blocked
- Brochure QR codes and public links may be omitted

### Facebook integrations

For current Facebook functionality, these are the practical minimum:

- `META_GRAPH_API_VERSION`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_PAGE_ACCESS_TOKEN`

`META_PAGE_ID` is strongly recommended because it makes Page publishing configuration clearer and more predictable.

### AI Sales Analyst

If `OPENAI_API_KEY` is missing:

- `/admin/ai` still loads
- The page shows a setup-required state
- No AI request is sent

## Example Local Setup

See:

- [docs/MILESTONE_1_SETUP.md](/Users/tjcoyoca/Documents/car-dealership/docs/MILESTONE_1_SETUP.md)
- [docs/PRODUCTION_READINESS.md](/Users/tjcoyoca/Documents/car-dealership/docs/PRODUCTION_READINESS.md)

The repository template file is:

- [.env.example](/Users/tjcoyoca/Documents/car-dealership/.env.example)
