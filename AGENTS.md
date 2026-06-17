# AGENTS.md

# AGENTS.md — Instructions for Codex / Claude

## 1. Project Identity

You are working on a bespoke Facebook-connected car dealership platform.

This app is for one specific dealership client first, but the architecture should not block future multi-tenant SaaS expansion.

The app helps a dealership:

- Manage vehicle inventory
- Publish vehicles to a public website
- Capture leads from website forms, Facebook Lead Forms, Messenger/chatbot, and manual entry
- Track inquiries through a sales pipeline
- Store customer information
- Generate PDF brochures
- Export sales/inquiry reports
- Integrate with the dealership’s existing Facebook Page
- Provide AI-assisted sales and inventory insights later

Do not treat this as a generic marketplace.
Do not treat this as a full self-serve SaaS yet.
Do not overbuild OAuth onboarding for many dealerships unless explicitly requested.

---

## 2. Hard Technical Stack

Use:

- Next.js App Router
- TypeScript
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- shadcn/ui
- Tailwind CSS
- Server Actions for admin mutations
- Route Handlers for API endpoints, webhooks, PDF generation, and Facebook/Meta integration
- Meta Graph API / Meta Business SDK for Facebook functionality

Do not switch stacks.
Do not introduce a separate backend framework unless explicitly requested.
Do not introduce Prisma unless explicitly requested.
Do not introduce Firebase.
Do not introduce MongoDB.
Do not introduce a separate Express/Nest backend.

---

## 3. Implementation Style

Always implement in small vertical slices.

For each feature, prefer this sequence:

1. Database migration
2. Types
3. RLS policies
4. Server-side actions or route handlers
5. UI components
6. Page integration
7. Loading/empty/error states
8. Basic tests or manual test checklist
9. Documentation update

Never build UI that has no backing data model unless it is explicitly a placeholder.

Never create fake working integrations.

If a feature is not fully connected yet, label it clearly as:

```txt
Coming soon
Not connected
Draft only
Manual export only
```

---

## 4. Code Quality Standards

Use TypeScript strictly.

Rules:

- No `any` unless there is a documented reason.
- Prefer explicit return types for server actions and API handlers.
- Validate all incoming form/API data with Zod.
- Keep server-only code out of client components.
- Keep secrets out of client components.
- Keep Meta/Facebook API calls server-side only.
- Avoid large components.
- Prefer feature-based folders.
- Keep UI components reusable but do not over-abstract too early.
- Use readable names over clever names.

---

## 5. Suggested Folder Structure

Use this structure unless the repo already has a better equivalent:

```txt
app/
  (admin)/
    dashboard/
    vehicles/
    inquiries/
    customers/
    pipeline/
    brochures/
    reports/
    facebook/
    ai/
    settings/
  (public)/
    [dealerSlug]/
      page.tsx
      vehicles/
        page.tsx
        [vehicleSlug]/
          page.tsx
  api/
    public-inquiry/
    brochures/
    facebook/
      webhook/
      publish-post/
      lead-forms/
      messenger/
      test-connection/
    ai/
components/
  ui/
  layout/
  forms/
  data-table/
features/
  vehicles/
  inquiries/
  customers/
  pipeline/
  facebook/
  brochures/
  reports/
  ai/
lib/
  supabase/
  auth/
  validators/
  facebook/
  pdf/
  ai/
  utils/
supabase/
  migrations/
docs/
```

---

## 6. Naming Standards

Use clear business names.

Good:

```txt
vehicles
vehicle_media
customers
inquiries
inquiry_events
vehicle_sales
facebook_connections
facebook_webhook_events
messenger_conversations
messenger_messages
brochure_exports
```

Avoid vague names:

```txt
items
records
data
stuff
entries
fbdata
```

---

## 7. Database Standards

All tenant-sensitive tables must include:

```txt
dealership_id uuid not null references dealerships(id)
```

All main tables should include:

```txt
id uuid primary key default gen_random_uuid()
created_at timestamptz default now()
updated_at timestamptz default now()
```

Create `updated_at` triggers where appropriate.

Use RLS for all non-public tables.

Public vehicle reads must only expose published vehicles.

Do not trust a client-supplied `dealership_id`.

For authenticated admin actions, derive dealership access from:

```txt
dealership_members
```

---

## 8. Supabase RLS Rules

Minimum RLS pattern:

- Dealership members can read dealership records.
- Admin/owner can create and update dealership records.
- Sales agents can read vehicles and manage assigned inquiries.
- Public users can read only published vehicle data.
- Public users cannot directly query private customer/inquiry tables.
- Public inquiry creation must go through a server endpoint or carefully restricted insert policy.
- Facebook webhook inserts must use server-side service role.

Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.

---

## 9. Server Actions vs API Routes

Use Server Actions for:

- Create vehicle
- Update vehicle
- Delete/archive vehicle
- Publish/unpublish vehicle
- Create manual lead
- Update inquiry status
- Add inquiry note
- Mark vehicle sold
- Update customer
- Generate internal draft content

Use Route Handlers for:

- Public inquiry submit endpoint
- Facebook webhook verification
- Facebook lead webhook receiver
- Messenger webhook receiver
- Facebook publish post action
- PDF generation
- AI query endpoint
- File export endpoint

---

## 10. Facebook / Meta Rules

This is a controlled bespoke integration.

Do not build a full self-serve OAuth integration unless explicitly requested.

Initial Facebook settings can assume one configured dealership Page.

Required records:

```txt
facebook_connections
facebook_webhook_events
facebook_api_logs
facebook_leads
messenger_conversations
messenger_messages
```

Never call Facebook APIs from the browser.

Never expose Page access tokens.

All Facebook API calls must:

- Run server-side
- Log request context
- Log response or error
- Store external IDs
- Be idempotent where possible
- Fail safely with a user-friendly admin error

When processing webhooks:

- Store the raw payload first
- Verify the webhook token/challenge where applicable
- Process asynchronously or in a safe retryable function where possible
- Prevent duplicate leads using external IDs
- Link to existing customers by phone/email when available
- Create partial leads when only Messenger identity is known

---

## 11. Lead System Rules

All lead sources must enter the same inquiry pipeline.

Do not create separate UI silos for Facebook leads, Messenger leads, website leads, and manual leads.

The unified flow is:

```txt
Customer → Inquiry → Pipeline → Follow-up → Sale/Lost
```

Lead source values:

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

Manual lead entry is part of the MVP, not an afterthought.

Manual lead form fields:

```txt
customer_name
phone
email
interested_vehicle_id
source_type
source_detail
message
budget_range
payment_preference
assigned_to
next_follow_up_at
status
```

Add duplicate detection by:

- Phone
- Email
- Similar name

If a possible duplicate exists, show a confirmation step.

---

## 12. Vehicle System Rules

Vehicle statuses:

```txt
draft
published
reserved
sold
archived
```

Only `published` and available vehicles appear publicly.

Vehicle fields should support:

```txt
stock_number
title
brand
model
variant
year
price
mileage
fuel_type
transmission
body_type
color
plate_number
vin
description
status
availability
featured_image_url
```

Vehicle media should support:

```txt
url
sort_order
is_featured
alt_text
```

Do not delete sold vehicles.
Use status changes.

---

## 13. Public Website Rules

Public website must be fast, clean, and lead-focused.

Each vehicle detail page should include:

- Vehicle photos
- Price
- Main specs
- Description
- Inquiry form
- Messenger CTA
- Brochure CTA
- Contact details
- Related vehicles if available

Do not expose admin-only fields publicly.

Public inquiry form must create:

- Customer record
- Inquiry record
- Lead source event

---

## 14. PDF Brochure Rules

Brochures can be generated for:

- One vehicle
- Multiple selected vehicles

Brochure must include:

- Dealership branding
- Vehicle photos
- Specs
- Price
- Contact details
- Public vehicle QR/link
- Disclaimer
- Generated date

Store generated brochure metadata in:

```txt
brochure_exports
```

---

## 15. Reporting Rules

Initial reports:

- Inventory report
- Sales report
- Inquiry report
- Lead source report
- Pipeline report

Reports must support:

- Date range filtering
- CSV export
- Simple summary cards
- Clear empty states

Do not fake metrics.

---

## 16. AI Rules

AI is read-only at first.

AI may:

- Analyze inventory
- Summarize sales
- Summarize inquiries
- Recommend follow-ups
- Recommend vehicles to promote
- Draft Facebook captions
- Explain pipeline trends

AI must not:

- Publish Facebook posts automatically
- Launch ads automatically
- Modify customer data automatically
- Mark leads won/lost automatically
- Change vehicle prices automatically

Use the name:

```txt
AI Sales Analyst
```

---

## 17. UX Rules

Follow `docs/admin-design-system.md` as the source of truth for admin layout, spacing, tables, tabs, sidebar behavior, top navigation, copy density, and visual hierarchy.

Every admin page must provide clear context, but not every page needs a large title and description.

Use one of these context patterns:

- Sidebar active state plus compact content title
- Breadcrumb or tab context plus compact title
- Detail page object title
- Table toolbar with obvious resource context

Avoid redundant page headers when the sidebar, active tab, table, or selected record already explains the page.

Do not add short descriptions by default. Add a description only when it helps the user understand a complex workflow, risky action, integration status, empty state, or required setup step.

Every admin page must still include:

- A clear primary action when applicable
- Empty state
- Loading state
- Error state
- Permission-aware UI
- Destructive action confirmation
- Status badges where useful
- Tabs for related long forms or detail sections

Use a table-first pattern for list/data pages:

```txt
[Optional Tabs]
[Search] [Filters] [Group By]                    [Primary Add Action]
[Data Table]
[Pagination]
```

Use cards only when they improve grouping, such as dashboard metrics, integration cards, summary panels, or detail side panels.

Do not scatter random explanatory text across the screen.
Do not use large hero-style headers inside admin pages.
Do not wrap every section in a card by default.
Do not add decorative UI that does not improve usability.

Keep the admin interface clean, direct, spacious, and consistent with `designs/reference.png`.

---

## 18. Completion Criteria

A feature is not complete unless:

- Database migration exists
- RLS is considered
- UI exists
- Server action/API exists
- Validation exists
- Error handling exists
- Empty/loading states exist
- Manual test checklist exists
- No secrets are exposed
- Feature is documented if it affects architecture

---

## 19. How to Ask Before Changing Architecture

Before introducing any new major dependency, create a short note explaining:

```txt
Problem
Why existing stack is not enough
Proposed dependency
Tradeoffs
Migration impact
```

Do not add major dependencies silently.

---

## 20. Local Development Commands

Use the commands defined in `package.json`.

Expected commands:

```txt
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

If any command is missing, add it before relying on it.

Before marking work complete, run:

```txt
pnpm lint
pnpm typecheck
pnpm build
```

If a command fails because of pre-existing issues, document the failure and the exact error.

## Client Branding Rules

The admin UI must use the client’s brand identity, not generic template colors.

For Best Wheels Car Display:

- Use the Best Wheels logo in login and sidebar branding.
- Use red as the primary accent.
- Use charcoal/black for primary text and navigation.
- Use white surfaces and light gray backgrounds.
- Do not use orange/peach as the main UI accent unless specifically approved.

Logo usage:

- Full logo may be used on login and large branding areas.
- Sidebar logo must be constrained and never distorted.
- Use `object-contain`, not `object-cover`.
- Do not let the logo push navigation down too far.
- If the full logo is too wide, use a compact text version: `Best Wheels` with `Car Display` as small muted text.

Branding should support the UI, not overpower it.
