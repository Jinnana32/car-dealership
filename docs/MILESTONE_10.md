# Milestone 10

## Scope

Implemented Facebook Lead Form webhook ingestion only.

Included:

- `facebook_leads` import tracking
- `facebook_lead_form_mappings` manual admin mapping
- `GET /api/facebook/leadgen/webhook` verification
- `POST /api/facebook/leadgen/webhook` ingestion
- Raw webhook event storage in `facebook_webhook_events`
- Server-side Graph API lead detail fetch
- Customer reuse by exact phone or exact email
- Inquiry creation with `source_type = facebook_lead_form`
- Inquiry event annotation
- Lead source event annotation
- Admin pages for imported leads and form mappings
- Facebook Sales Hub lead sync summary

Not included:

- Facebook ad creation or management
- Messenger auto-replies or outbound Messenger messages
- AI, brochures, reports, or ad performance sync

## Required Environment

The webhook and lead detail fetch use the existing server-only Meta configuration:

- `META_WEBHOOK_VERIFY_TOKEN`
- `META_PAGE_ACCESS_TOKEN`
- `META_GRAPH_API_VERSION`
- `META_PAGE_ID` as optional fallback context

No Meta tokens are exposed client-side.

## Processing Flow

1. Meta sends a leadgen webhook event to `/api/facebook/leadgen/webhook`.
2. The app verifies Page context from `facebook_connections`.
3. The raw event is stored in `facebook_webhook_events`.
4. A `facebook_leads` row is created or reused by `leadgen_id`.
5. Full lead details are fetched server-side from the Graph API.
6. Field data is mapped using the dealership’s manual form mapping when present, otherwise default aliases.
7. The importer reuses an existing customer by exact phone or exact email when possible.
8. The importer creates an inquiry with `source_type = facebook_lead_form`.
9. The inquiry `created` event and the lead source event are updated with Facebook Lead Form metadata.
10. The lead appears in `/admin/facebook/leads`, `/admin/inquiries`, and `/admin/pipeline`.

## Manual Mapping Notes

`/admin/facebook/lead-forms` supports manual mapping because this integration is bespoke.

Supported normalized keys:

- `full_name`
- `phone`
- `email`
- `budget_range`
- `payment_preference`
- `message`

Optional vehicle linking can be configured per form. If no vehicle mapping exists, the importer only attempts safe matching from the form name.
