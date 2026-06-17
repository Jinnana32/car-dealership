# PROJECT_STACK.md

# Facebook-Connected Car Dealership Platform — Project Stack

## 1. Product Summary

This project is a bespoke dealership platform for one specific car dealership client and their existing Facebook Page.

The system allows the dealership to:

- Manage vehicle inventory through an admin panel
- Publish selected vehicles to a public-facing website
- Capture leads from multiple sources
- Track inquiries through a sales pipeline
- Store customer information
- Generate PDF brochures for one or multiple vehicles
- Export sales and inquiry reports
- Integrate with the client’s existing Facebook Page
- Capture Facebook Lead Form and Messenger/chatbot leads
- Generate Facebook-ready captions, posts, and ad content
- Eventually use AI to analyze sales, inventory, inquiries, and lead performance

This is not a full self-serve SaaS Facebook integration yet. The initial version is a controlled bespoke implementation for one dealership. However, the database should still include `dealership_id` on core records so the app can evolve into multi-tenant SaaS later.

---

## 2. Core Technology Stack

### Frontend / Fullstack Framework

Use:

- Next.js App Router
- TypeScript
- React Server Components where appropriate
- Server Actions for trusted admin mutations
- Route Handlers for webhooks, external integrations, PDF generation, and AI endpoints

Preferred project structure:

```txt
app/
  (public)/
  (admin)/
  api/
components/
lib/
features/
supabase/
docs/
```

Use server-side logic for:

- Creating vehicles
- Updating vehicles
- Publishing/unpublishing vehicles
- Creating customers
- Creating inquiries
- Updating pipeline stages
- Generating brochures
- Calling Meta/Facebook APIs
- Processing webhooks

Do not call Meta APIs directly from the browser.

---

### Backend / Database

Use Supabase for:

- PostgreSQL database
- Auth
- Row Level Security
- Storage
- Realtime where needed
- Edge Functions only when a standalone webhook/function is better than a Next.js API route

Use Supabase as the source of truth for:

- Dealership profile
- Admin users
- Vehicles
- Vehicle media
- Customers
- Inquiries
- Pipeline stages
- Sales
- Brochure exports
- Facebook integration settings
- Facebook webhook events
- AI-readable business records

---

### UI System

Use:

- Tailwind CSS
- shadcn/ui
- Radix primitives through shadcn components
- lucide-react for icons
- react-hook-form for complex forms
- zod for validation
- sonner for toasts
- TanStack Table only when the table becomes complex enough to justify it

Preferred UI style:

- Clean SaaS admin dashboard
- Intentional cards only where useful; table-first for list/data pages
- Clear status badges
- Compact but readable tables
- Mobile-friendly public pages
- Desktop-first admin, but avoid completely broken mobile views
- No unnecessary decorative UI
- No fake analytics numbers
- No placeholder text on production screens unless explicitly marked as empty state
- Follow `docs/admin-design-system.md` for admin shell, sidebar, top navigation, table toolbar, tabs, spacing, and copy-density rules

---

## 3. Facebook / Meta Integration Stack

This is a bespoke integration with the client’s existing Facebook Page.

Use:

- Meta Graph API
- Meta Business SDK for server-side business/marketing API operations if needed
- Facebook JavaScript SDK only if required for login/OAuth or client-side Facebook features
- Server-side token storage only
- Encrypted token storage if tokens are persisted in the database
- Route Handlers or Supabase Edge Functions for webhook endpoints

Initial Facebook-related features:

1. Facebook integration settings page
2. Facebook Page connection status
3. Facebook post/caption generator from vehicle data
4. Publish vehicle content to the Facebook Page
5. Messenger `m.me` link generation with vehicle context
6. Messenger webhook receiver for chatbot/message leads
7. Facebook Lead Ads webhook receiver
8. Facebook lead mapping into customers and inquiries
9. Facebook webhook event logs
10. Facebook API error logs

Later Facebook-related features:

1. Create ad drafts
2. Create paused campaigns
3. Sync ad performance
4. Sync comments as soft leads
5. Automotive catalog feed
6. Meta Pixel setup
7. AI recommendations for which vehicles to promote

---

## 4. Package Recommendations

Use `pnpm` unless the project already uses another package manager.

Suggested packages:

```txt
next
react
react-dom
typescript
@supabase/supabase-js
@supabase/ssr
zod
react-hook-form
@hookform/resolvers
lucide-react
sonner
date-fns
clsx
tailwind-merge
class-variance-authority
```

For shadcn/ui:

```txt
button
card
input
textarea
select
dialog
dropdown-menu
sheet
table
badge
tabs
form
calendar
popover
separator
alert
alert-dialog
sonner
```

For PDF generation, choose one approach and document it before implementation:

Option A:

```txt
HTML template → server-side browser rendering → PDF
```

Option B:

```txt
React PDF renderer → PDF
```

For the MVP, prioritize the approach that works reliably in the deployment environment.

---

## 5. Environment Variables

Use environment variables for all secrets.

Required base variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Facebook variables:

```txt
META_APP_ID=
META_APP_SECRET=
META_GRAPH_API_VERSION=
META_WEBHOOK_VERIFY_TOKEN=
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
META_PIXEL_ID=
```

AI variables, when added:

```txt
OPENAI_API_KEY=
```

Never expose the service role key, app secret, or page access token to the browser.

Only `NEXT_PUBLIC_*` variables may be used client-side.

---

## 6. Database Principles

All core business records should include:

```txt
id
dealership_id
created_at
updated_at
```

Use UUID primary keys.

Use enums or constrained text fields for statuses.

Prefer normalized tables over storing important business data only in JSON.

JSONB is acceptable for:

- Raw Facebook webhook payloads
- API request/response logs
- AI context snapshots
- Flexible settings
- External integration metadata

---

## 7. Core Tables

Initial tables:

```txt
dealerships
profiles
dealership_members
vehicles
vehicle_media
customers
inquiries
inquiry_events
pipeline_stages
vehicle_sales
brochure_exports
lead_source_events
facebook_connections
facebook_webhook_events
facebook_leads
messenger_conversations
messenger_messages
facebook_api_logs
```

Later tables:

```txt
facebook_ad_drafts
facebook_campaigns
facebook_catalog_feeds
ai_documents
ai_embeddings
ai_chat_sessions
ai_chat_messages
```

---

## 8. Security Principles

Use Supabase Row Level Security for all tenant-sensitive tables.

Rules:

- Admin users can only access records for dealerships where they are members.
- Sales agents can access assigned leads and general vehicle information.
- Public users can only read published vehicles.
- Public users can create inquiry records only through controlled server endpoints.
- Service role access must only happen server-side.
- Facebook webhook endpoints must validate verification tokens and log all events.
- Never expose raw Facebook tokens to the frontend.
- Never trust client-supplied `dealership_id`; derive it from authenticated membership or route context.

---

## 9. Public Website Principles

Public website should show only:

```txt
vehicles.status = 'published'
vehicles.availability = 'available'
```

Public pages:

```txt
/[dealerSlug]
/[dealerSlug]/vehicles
/[dealerSlug]/vehicles/[vehicleSlug]
```

Public vehicle page should include:

- Featured photo
- Gallery
- Price
- Vehicle specs
- Description
- Inquiry form
- Messenger CTA
- Download brochure CTA
- Dealership contact details

---

## 10. Lead Source Principles

All leads should flow into one unified pipeline.

Lead sources:

```txt
facebook_lead_form
facebook_messenger
website_inquiry_form
manual_entry
phone_call
walk_in
referral
facebook_comment
viber
whatsapp
other
```

Automatic lead sources for initial build:

- Website inquiry form
- Facebook Lead Form webhook
- Messenger/chatbot webhook

Manual lead sources for initial build:

- Phone call
- Walk-in
- Referral
- Facebook comment
- Viber/WhatsApp
- Other

Do not build separate disconnected lead modules. Everything should become:

```txt
Customer → Inquiry → Pipeline → Follow-up → Sale/Lost
```

---

## 11. AI Principles

AI should be read-only in the first version.

AI can:

- Summarize sales
- Identify slow-moving vehicles
- Recommend vehicles to promote
- Summarize pipeline status
- Draft Facebook captions
- Suggest follow-up priorities
- Explain inquiry trends

AI should not initially:

- Publish Facebook posts without approval
- Create or launch ads without approval
- Change vehicle prices
- Mark sales as won/lost
- Message customers automatically

The first AI module should be called:

```txt
AI Sales Analyst
```

Not:

```txt
Autonomous AI Agent
```

---

## 12. Development Philosophy

Build vertical slices.

Do not build the entire system at once.

Correct order:

```txt
Auth → Dealership setup → Vehicles → Public listings → Inquiries → Pipeline → Manual leads → Facebook lead capture → Brochures → Reports → AI
```

Every milestone must include:

- Database migration
- RLS policies
- Server-side actions/routes
- UI screens
- Empty states
- Loading states
- Error states
- Basic acceptance testing

```

```
