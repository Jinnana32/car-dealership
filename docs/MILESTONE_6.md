# Milestone 6

Milestone 6 connects the public vehicle website to the internal CRM pipeline.

## Included

- Public vehicle inquiry form on `/<dealerSlug>/vehicles/<vehicleSlug>`
- Server-side inquiry capture endpoint at `/api/public-inquiry`
- Zod validation for public inquiry submissions
- Honeypot spam protection through `company_website`
- Customer matching by exact phone, then exact email within the same dealership
- Customer creation when no match exists
- Inquiry creation with `source_type = website_inquiry_form`
- Inquiry event creation/update for public vehicle submissions
- Lead source event creation/update for public vehicle submissions
- Admin pipeline compatibility through the existing inquiry and customer modules

## Not Included

- Facebook lead ingestion
- Messenger chatbot or Messenger webhook handling
- PDF brochures
- Reports
- AI features
- Advertising tools

## Data Flow

1. A visitor submits the inquiry form from a published, available public vehicle detail page.
2. The server validates the payload and rejects invalid or unavailable submissions.
3. The system resolves the dealership and vehicle by slug.
4. The system reuses an existing customer by exact phone or exact email when possible.
5. If no customer match exists, the system creates a new customer.
6. The system creates an inquiry linked to the dealership, customer, and vehicle.
7. The system records the inquiry creation event and lead source event.
8. The inquiry appears in the admin inquiries list and in the pipeline under `New`.

## Manual Verification

1. Open a published, available vehicle detail page at `/<dealerSlug>/vehicles/<vehicleSlug>`.
2. Submit the inquiry form with a valid full name and phone number.
3. Confirm the success message appears on the public page.
4. Open `/admin/customers` and confirm a customer record exists.
5. Open `/admin/inquiries` and confirm an inquiry record exists.
6. Open `/admin/pipeline` and confirm the inquiry appears under `New`.
7. Open the inquiry detail page and confirm the source shows as website inquiry and the message is visible.
8. Submit another inquiry with the same phone number and confirm the customer is reused.
9. Submit another inquiry with an invalid email and confirm validation fails.
10. Submit another inquiry with a missing full name and confirm validation fails.
11. Submit another inquiry with a missing phone number and confirm validation fails.
12. Try posting directly to `/api/public-inquiry` for a draft or unavailable vehicle and confirm the request is rejected.
13. Confirm the inquiry timeline includes the website inquiry creation event.
14. Confirm a `lead_source_events` record exists with `event_name = public_vehicle_inquiry_submitted`.
15. Check the public vehicle detail page at mobile width.
16. Confirm admin vehicles, customers, inquiries, and pipeline pages still work.
17. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
