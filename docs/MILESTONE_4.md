# Milestone 4

Milestone 4 adds the internal CRM foundation for customers, inquiries, and manual lead entry.

## Included

- Supabase tables for `customers`, `inquiries`, `inquiry_events`, and `lead_source_events`
- RLS policies for dealership-scoped CRM access
- Manual lead flow at `/admin/leads/new`
- Customer list and detail pages
- Inquiry list and detail pages
- Duplicate customer detection by phone, email, and case-insensitive full name
- Automatic `inquiry_events` and `lead_source_events` creation when a new inquiry is inserted

## Not Included

- Public website inquiry form
- Facebook lead ingestion
- Messenger integration
- Pipeline Kanban
- PDF brochures
- Reports
- AI features

## Manual Setup Notes

Apply the migration:

```bash
supabase db push
```

The CRM feature depends on the earlier milestones:

- auth and dealership membership
- vehicle inventory

Manual leads can optionally link to an existing vehicle from the same dealership.

## Manual Verification

1. Open `/admin/customers`.
2. Open `/admin/inquiries`.
3. Confirm the empty states appear when there is no CRM data.
4. Open `/admin/leads/new` and create a lead with a new customer.
5. Create another lead with the same phone number and confirm duplicate detection appears.
6. Choose `Use Existing Customer` and confirm the lead is attached to the existing customer.
7. Create another lead and choose `Create New Customer Anyway`.
8. Confirm the new inquiry detail page shows source, message, budget, payment preference, and status.
9. Confirm the inquiry timeline includes the `created` event.
10. Confirm a `lead_source_events` row exists for the new inquiry.
11. Open the linked customer detail page and confirm related inquiries are shown.
12. Confirm sales agents can view CRM pages and add leads within their dealership access.
13. Confirm another dealership user cannot read these customers or inquiries.
14. Confirm `/admin/vehicles` and public vehicle routes still work.
15. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
