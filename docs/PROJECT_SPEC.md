# PROJECT_SPEC.md

# Facebook-Connected Car Dealership Platform — Project Specification

## 1. Product Goal

Build a bespoke car dealership platform that helps one dealership manage inventory, publish vehicle listings, capture leads from Facebook and the public website, track every inquiry through a sales pipeline, generate brochures, export reports, and later use AI to understand sales performance.

The main sales promise of the product is:

```txt
Upload a vehicle once.
Turn it into a public listing, Facebook-ready post, brochure, and trackable sales inquiry.
```

This is a bespoke build first, not a full self-serve SaaS.

---

## 2. Core Business Flow

The core workflow is:

```txt
Admin adds vehicle
→ Admin publishes vehicle
→ Vehicle appears on public website
→ System generates Facebook-ready content
→ Customer inquires through website, Facebook Lead Form, Messenger, or manual input
→ Customer and inquiry are stored
→ Inquiry enters pipeline
→ Sales team follows up
→ Vehicle is reserved, sold, or marked lost
→ Reports show inventory, leads, sales, and source performance
→ AI later helps explain trends and recommend actions
```

---

## 3. User Roles

### Owner

Can:

- Manage dealership settings
- Manage all users
- Manage all vehicles
- Manage all customers
- Manage all inquiries
- Manage Facebook integration
- View all reports
- Export data
- Use AI analyst

### Admin

Can:

- Manage vehicles
- Manage customers
- Manage inquiries
- Manage pipeline
- Generate brochures
- View reports
- Use Facebook tools

### Sales Agent

Can:

- View available vehicles
- Add leads
- Manage assigned inquiries
- Add notes
- Move leads through pipeline
- Generate brochures

### Public Visitor

Can:

- View published vehicles
- Submit inquiry form
- Click Messenger CTA
- Download or request brochure if enabled

---

## 4. Main Modules

### Module 1: Authentication and Dealership Setup

Purpose:

Create secure admin access and prepare the system for one dealership client.

Build:

- Supabase Auth login
- Protected admin layout
- Dealership profile table
- User profile table
- Dealership membership table
- Role-based navigation
- Basic settings page

Completion criteria:

- User can log in
- User can access admin dashboard
- Unauthorized users cannot access admin routes
- Dealership record exists
- RLS policies prevent cross-dealership access
- Admin navigation is ready

---

### Module 2: Vehicle Inventory

Purpose:

Allow dealership staff to manage vehicles.

Build:

- Vehicle list page
- Add vehicle form
- Edit vehicle form
- Vehicle detail page
- Vehicle status management
- Vehicle photo upload
- Featured photo selection
- Draft/published/reserved/sold/archived statuses
- Search and filters

Vehicle fields:

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
```

Completion criteria:

- Admin can create a vehicle
- Admin can upload photos
- Admin can set featured image
- Admin can publish/unpublish a vehicle
- Sold vehicles are preserved, not deleted
- Vehicle list has search/filter
- Vehicle detail has Facebook, inquiries, and brochure entry points

---

### Module 3: Public Vehicle Website

Purpose:

Show published vehicles to public customers.

Build:

- Public dealership homepage
- Public vehicle listing page
- Public vehicle detail page
- Inquiry CTA
- Messenger CTA
- Brochure CTA
- Basic SEO metadata
- Mobile-friendly design

Public routes:

```txt
/[dealerSlug]
/[dealerSlug]/vehicles
/[dealerSlug]/vehicles/[vehicleSlug]
```

Rules:

- Only published and available vehicles appear publicly
- Draft, archived, and internal-only vehicles must not appear
- Sold vehicles may be hidden by default or shown only if dealership wants a sold gallery

Completion criteria:

- Public users can browse published vehicles
- Vehicle detail page shows accurate photos/specs/price
- Inquiry form is visible
- Messenger CTA is visible
- Admin-only fields are not exposed

---

### Module 4: Customer and Inquiry System

Purpose:

Create one unified CRM pipeline for all leads.

Build:

- Customers table
- Inquiries table
- Inquiry events/history table
- Customer detail page
- Inquiry detail page
- Inquiry list page
- Lead source tracking
- Duplicate detection

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

Completion criteria:

- Inquiry always belongs to a customer
- Inquiry may optionally belong to a vehicle
- Customer can have multiple inquiries
- Vehicle can have multiple inquiries
- Duplicate detection checks phone/email/name
- Inquiry history records status changes and notes

---

### Module 5: Manual Lead Entry

Purpose:

Allow dealership staff to enter leads from phone calls, walk-ins, referrals, comments, Viber, WhatsApp, or other manual sources.

Build:

- `+ Add Lead` button
- Manual lead form
- Customer matching step
- Inquiry creation
- Assignment to sales agent
- Next follow-up date
- Notes

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

Completion criteria:

- Staff can create a lead manually
- Staff can select existing customer or create new one
- Manual lead appears in same pipeline as Facebook/website leads
- Source is clearly labeled
- Manual leads are included in reports

---

### Module 6: Pipeline

Purpose:

Give the dealership visibility over every active lead.

Build:

- Kanban pipeline view
- Table/list pipeline view
- Status update action
- Inquiry note action
- Follow-up date
- Assigned sales agent
- Lost reason
- Won/sold conversion

Default statuses:

```txt
new
contacted
viewing_scheduled
negotiation
reserved
won
lost
```

Lost reasons:

```txt
price_too_high
bought_elsewhere
not_responsive
financing_failed
vehicle_unavailable
other
```

Completion criteria:

- Leads can move through statuses
- Pipeline changes create inquiry events
- Leads can be marked won or lost
- Won inquiry can create vehicle sale
- Lost inquiry requires lost reason
- Pipeline has filters by source, assigned agent, vehicle, and status

---

### Module 7: Website Inquiry Form

Purpose:

Capture leads from the public website.

Build:

- Inquiry form on vehicle detail page
- Optional general inquiry form
- Server endpoint for public inquiry
- Spam protection approach
- Customer creation/update
- Inquiry creation
- Lead source event creation

Fields:

```txt
name
phone
email
message
payment_preference
budget_range
preferred_viewing_date
```

Completion criteria:

- Public visitor can submit inquiry
- System creates/updates customer
- System creates inquiry
- Inquiry appears in pipeline
- Admin can see source as website inquiry
- Form handles success/error states

---

### Module 8: Facebook Integration Settings

Purpose:

Configure and monitor the bespoke Facebook Page integration without exposing unnecessary technical complexity to normal admin users.

Build:

- Facebook settings page using a clean integration-card pattern
- Overview tab showing Page connection status, Page name, last checked time, and primary actions
- Publishing tab for Page publishing readiness and posting configuration
- Webhooks tab for webhook status and setup instructions
- Logs tab for API logs and webhook logs
- Advanced tab for Page ID, Ad Account ID, Pixel ID, token status, and webhook verify token details
- Server-side test connection action
- Integration health card
- API logs page or tab
- Webhook logs page or tab

Preferred UI pattern:

```txt
Facebook Integration

Tabs: Overview | Publishing | Webhooks | Logs | Advanced

Overview:
Facebook Page
Connected to: ABC Motors
Status: Connected
Last checked: Jan 15, 2026

[Test Connection] [Manage]
```

UI rules:

- Do not show raw Page IDs, webhook tokens, or technical logs on the default overview screen.
- Put technical fields under `Advanced` or `Logs`.
- Keep the main view short and status-focused.
- Use clear statuses such as `Not Connected`, `Connected`, `Needs Reconnect`, `Ready`, and `Error`.
- Follow `docs/admin-design-system.md` for tabs, cards, spacing, and copy density.

Tables:

```txt
facebook_connections
facebook_api_logs
facebook_webhook_events
```

Completion criteria:

- Admin can see connected Page information in a compact overview
- System can test connection server-side
- API errors are logged
- Webhook events are logged
- Advanced technical data is available without cluttering the default UI
- Tokens are never exposed client-side

---

### Module 9: Facebook Post / Ad Kit Generator

Purpose:

Turn vehicle data into Facebook-ready sales content with a simple, non-cluttered workflow.

Build:

- Facebook tab on vehicle detail page
- Primary `Generate Facebook Post` action
- Generated content panel containing caption, headline, CTA, and public listing link
- Copy caption action
- Download/select vehicle photos action, if practical
- Open public listing action
- Open Facebook Page action for manual posting fallback
- Messenger link generation with vehicle context
- Advanced content options for short caption, long caption, and marketplace-style description

Preferred UI pattern:

```txt
Vehicle Detail → Facebook Tab

Status: Not Posted

[Generate Facebook Post]

Generated Post
- Caption
- Headline
- CTA
- Public listing link

[Copy Caption] [Download Photos] [Open Facebook Page]

Advanced
- Short caption
- Long caption
- Marketplace-style description
- Messenger link
```

UI rules:

- Do not render every generated variant as a visible top-level button.
- Keep one obvious primary action: `Generate Facebook Post`.
- Put less-used variants under `Advanced` or a collapsible section.
- Do not explain Meta API complexity inside the vehicle page.
- Clearly show missing required vehicle fields before generation or publishing.
- Follow `docs/admin-design-system.md` for tabs, actions, spacing, and copy density.

Completion criteria:

- Admin can generate Facebook-ready text from vehicle data
- Admin can copy captions
- Admin can open public listing
- Admin can open Facebook Page for manual posting fallback
- Admin can copy Messenger link
- Missing vehicle fields are clearly shown
- This works even before direct publishing is enabled

---

### Module 10: Facebook Page Publishing

Purpose:

Publish vehicle posts to the dealership’s existing Facebook Page.

Build:

- Server-side publish action
- Select vehicle images
- Use generated caption
- Confirm before publishing
- Store external Facebook post ID
- Show publish status
- Log API request/response
- Handle errors gracefully

Completion criteria:

- Admin can publish a vehicle post to Facebook Page
- Published post ID is stored
- Failed publish attempts are logged
- Admin sees success/failure state
- No Meta tokens are exposed to browser

Safety rule:

Do not publish automatically when a vehicle is created. Publishing must require explicit admin confirmation.

---

### Module 11: Messenger Entry Point and Chatbot Lead Capture

Purpose:

Capture leads from Messenger interactions.

Build:

- Generate `m.me` link with vehicle context
- Log Messenger CTA clicks from public vehicle page
- Messenger webhook receiver
- Store messenger conversations
- Store inbound/outbound messages
- Create partial lead when user messages
- Ask for missing details through chatbot flow if enabled
- Link conversation to inquiry

Tables:

```txt
messenger_conversations
messenger_messages
lead_source_events
```

Basic bot flow:

```txt
Customer opens Messenger for a vehicle
→ Bot confirms vehicle interest
→ Bot asks cash/financing/undecided
→ Bot asks name
→ Bot asks phone number
→ System creates/updates customer
→ System creates inquiry
→ Lead appears in pipeline
```

Completion criteria:

- Messenger links include vehicle context
- Messenger CTA clicks are tracked
- Incoming Messenger messages are stored
- Messenger conversation can create lead/inquiry
- Partial leads are allowed when phone/email is not yet known
- Admin can identify Messenger leads in pipeline

---

### Module 12: Facebook Lead Form Webhook

Purpose:

Automatically import leads from Facebook Lead Ads.

Build:

- Webhook verification endpoint
- Leadgen event receiver
- Fetch full lead details server-side
- Lead form mapping
- Duplicate detection
- Customer creation/update
- Inquiry creation
- Raw payload logging
- Failure/retry logging

Tables:

```txt
facebook_leads
facebook_webhook_events
```

Completion criteria:

- Facebook Lead Form submission creates inquiry
- Duplicate leadgen IDs do not create duplicate inquiries
- Raw payload is stored
- Lead is mapped to customer fields
- Admin can see source as Facebook Lead Form
- Failure states are visible in logs

---

### Module 13: PDF Brochures

Purpose:

Generate shareable/printable vehicle brochures.

Build:

- Single vehicle brochure
- Multi-vehicle brochure
- Dealership branding
- Vehicle photos/specs/price
- Public listing QR/link
- Contact details
- Disclaimer
- Save export metadata

Tables:

```txt
brochure_exports
```

Completion criteria:

- Admin can generate one-car PDF
- Admin can generate multi-car PDF
- PDF contains dealership branding
- PDF contains accurate vehicle data
- Export is recorded
- Brochure can be downloaded

---

### Module 14: Sales and Reports

Purpose:

Show business performance.

Build:

- Mark inquiry as won
- Create sale record
- Mark vehicle as sold
- Inventory report
- Sales report
- Inquiry report
- Lead source report
- Pipeline report
- CSV export

Tables:

```txt
vehicle_sales
```

Metrics:

```txt
total vehicles
available vehicles
reserved vehicles
sold vehicles
total inquiries
inquiries by source
won inquiries
lost inquiries
conversion rate
sales amount
top vehicles by inquiries
slow-moving vehicles
```

Completion criteria:

- Admin can mark vehicle sold
- Sale record is created
- Vehicle status changes to sold
- Reports use real data
- CSV export works
- Filters by date/source/status work

---

### Module 15: AI Sales Analyst

Purpose:

Help dealership understand inventory, sales, and leads.

Build:

- AI Analyst page
- Suggested questions
- Read-only data access
- Structured query helpers
- Optional embeddings later for notes/messages
- AI-generated Facebook captions
- AI-generated sales summaries

Suggested questions:

```txt
Which vehicles should we promote this week?
Which vehicles have many inquiries but no sale?
Which lead source performs best?
Which customers need follow-up today?
Summarize this month’s sales.
Write Facebook captions for slow-moving vehicles.
Which vehicles are not getting enough inquiries?
```

Completion criteria:

- AI can answer from real dealership data
- AI does not modify records
- AI does not publish to Facebook
- AI does not launch ads
- AI gives useful links/references to records where possible

---

## 5. Ordered Build Timeline

This is the recommended project sequence.

### Milestone 0: Repository Setup

Tasks:

- Create Next.js app
- Install Tailwind/shadcn/ui
- Configure Supabase client
- Add environment variables
- Add base layout
- Add lint/typecheck/build commands
- Add this documentation

Done when:

- App runs locally
- Supabase env is connected
- shadcn/ui works
- Admin/public route groups exist

---

### Milestone 1: Auth and Dealership Foundation

Tasks:

- Supabase Auth
- Profiles table
- Dealerships table
- Dealership members table
- Protected admin layout
- Role-based nav
- RLS foundation

Done when:

- Authenticated admin can access dashboard
- Unauthenticated user is redirected
- RLS blocks unauthorized access

---

### Milestone 2: Vehicle Inventory

Tasks:

- Vehicle schema
- Vehicle media schema
- Vehicle CRUD
- Photo uploads
- Draft/published statuses
- Vehicle list/search/filter

Done when:

- Admin can fully manage vehicles
- Vehicle photos upload correctly
- Vehicle status is respected

---

### Milestone 3: Public Website

Tasks:

- Public dealership page
- Public vehicle listing
- Vehicle detail page
- Public filtering
- Inquiry/Messenger/Brochure CTAs

Done when:

- Published vehicles appear publicly
- Draft/internal vehicles do not appear
- Public vehicle pages are clean and mobile-friendly

---

### Milestone 4: Customers, Inquiries, and Manual Leads

Tasks:

- Customer schema
- Inquiry schema
- Inquiry events
- Manual lead form
- Customer duplicate detection
- Inquiry detail page

Done when:

- Manual leads can be entered
- Leads create customers and inquiries
- Inquiry source is tracked
- Duplicate customers are handled

---

### Milestone 5: Pipeline

Tasks:

- Pipeline status system
- Kanban/list view
- Move status
- Add notes
- Assign owner
- Follow-up date
- Won/lost flow

Done when:

- All inquiries appear in one pipeline
- Status changes are logged
- Won inquiry can create sale

---

### Milestone 6: Website Inquiry Capture

Tasks:

- Public inquiry endpoint
- Vehicle inquiry form
- Customer creation/update
- Inquiry creation
- Spam protection
- Success/error UI

Done when:

- Public website inquiries appear in pipeline
- Lead source is website inquiry
- Form works without exposing private keys

---

### Milestone 7: Facebook Sales Hub Basic

Tasks:

- Facebook settings page
- Facebook connection table
- API logs
- Facebook tab on vehicle detail
- Caption/ad kit generator
- Messenger link generator
- CTA click tracking

Done when:

- Admin can generate Facebook-ready content
- Admin can copy Messenger link
- Messenger clicks are tracked
- Facebook settings are visible

---

### Milestone 8: Facebook Page Publishing

Tasks:

- Server-side publish action
- Confirm publish dialog
- Store Facebook post ID
- Log API response
- Error handling

Done when:

- Admin can publish vehicle post to Facebook Page
- System stores post reference
- Failures are logged clearly

---

### Milestone 9: Messenger Lead Capture

Tasks:

- Messenger webhook
- Store conversations
- Store messages
- Create partial leads
- Link vehicle context from referral
- Basic bot lead qualification

Done when:

- Messenger interaction can create inquiry
- Messenger messages are visible/logged
- Pipeline shows Messenger leads

---

### Milestone 10: Facebook Lead Form Webhook

Tasks:

- Lead Ads webhook endpoint
- Leadgen verification
- Fetch lead details
- Lead field mapping
- Duplicate prevention
- Customer/inquiry creation

Done when:

- Facebook Lead Forms create pipeline inquiries
- Duplicate external lead IDs are ignored
- Raw events are logged

---

### Milestone 11: PDF Brochures

Tasks:

- Single vehicle PDF
- Multi-vehicle PDF
- Branding
- QR/public link
- Download action
- Export history

Done when:

- Admin can download accurate brochures
- Brochure exports are recorded

---

### Milestone 12: Sales and Reports

Tasks:

- Vehicle sale records
- Mark vehicle sold
- Sales dashboard
- Inquiry reports
- Lead source reports
- CSV export

Done when:

- Sales flow works end-to-end
- Reports show real data
- CSV export works

---

### Milestone 13: AI Sales Analyst

Tasks:

- AI analyst page
- Suggested prompts
- Read-only data access
- Sales/inventory/lead summaries
- Facebook caption drafting

Done when:

- AI answers based on real system data
- AI does not mutate data
- AI gives useful business insights

---

### Milestone 14: Hardening and Handoff

Tasks:

- Full RLS review
- Empty/loading/error state review
- Mobile public page review
- Admin permission review
- Facebook failure scenario testing
- Webhook replay testing
- PDF print testing
- Production environment setup
- Client handoff notes

Done when:

- Core workflow works end-to-end
- Secrets are safe
- Webhooks are verified
- Client can use system with minimal developer assistance

---

## 6. MVP Definition

The MVP is complete when this flow works:

```txt
Admin logs in
→ Adds vehicle
→ Uploads photos
→ Publishes vehicle
→ Vehicle appears on public website
→ Customer submits inquiry
→ Inquiry appears in pipeline
→ Admin manually adds another lead
→ Admin moves lead through pipeline
→ Admin marks vehicle sold
→ Admin exports report
→ Admin generates brochure
→ Admin generates Facebook caption/Messenger link
```

The Facebook-enhanced MVP is complete when this also works:

```txt
Admin publishes vehicle post to Facebook Page
→ Facebook Lead Form creates inquiry
→ Messenger interaction creates inquiry
→ All leads appear in one pipeline
```

---

## 7. Features to Avoid in the First Build

Do not build these too early:

```txt
Full self-serve SaaS onboarding
Multi-client Facebook OAuth wizard
Automatic ad launching
Advanced campaign budget optimization
Instagram DM integration
WhatsApp integration
Full accounting
Payroll
Auction/bidding system
Marketplace for multiple dealerships
Complex permissions matrix
```

Build the controlled dealership workflow first.

---

## 8. Final Product Positioning

The product should be positioned as:

```txt
A Facebook-connected dealership sales platform that turns vehicle inventory into listings, leads, brochures, and sales follow-up.
```

Not just:

```txt
A car inventory system.
```

The strongest pitch is:

```txt
Manage your vehicles once.
Publish them online.
Capture Facebook and website leads.
Track every customer until sold.
```
