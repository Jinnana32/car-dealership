# Milestone 7

Milestone 7 adds the first Facebook-focused sales workflow layer without calling the live Meta APIs yet.

## Included

- `facebook_connections` table for dealership-scoped Page and Messenger settings
- `facebook_generated_content` table for saved Facebook-ready captions and ad kits
- Facebook Sales Hub overview at `/admin/facebook`
- Facebook settings page at `/admin/facebook/settings`
- Generated content history at `/admin/facebook/content`
- Vehicle detail Facebook readiness and content section on `/admin/vehicles/[id]`
- Deterministic Facebook caption, marketplace description, ad primary text, and ad headline generation
- Messenger link generation based on `messenger_page_identifier`
- Public Messenger CTA click tracking through `/api/messenger-click`
- Messenger CTA logging into `lead_source_events`

## Not Included

- Facebook Page publishing
- Meta Graph API post creation
- Facebook Lead Form webhook ingestion
- Messenger webhook ingestion
- Chatbot replies
- Ad campaign creation
- PDF brochures
- Reports
- AI-generated Facebook content

## Data Notes

- Messenger links are generated as `https://m.me/{messenger_page_identifier}?ref=vehicle_{vehicleSlug}`.
- Public Messenger CTA clicks create only `lead_source_events`.
- Messenger CTA clicks do not create customers or inquiries.
- Generated content is saved on each generate/regenerate action and older records remain in history.

## Manual Verification

1. Confirm `Facebook Sales Hub` appears in the admin sidebar.
2. Open `/admin/facebook`.
3. Confirm the overview page loads.
4. Open `/admin/facebook/settings`.
5. Save a Page name and Messenger page identifier.
6. Confirm the settings save successfully.
7. Open `/admin/vehicles/[id]` for a vehicle.
8. Confirm the Facebook readiness section appears.
9. Confirm missing readiness fields are shown clearly when data is incomplete.
10. Generate a Facebook caption.
11. Generate a marketplace description.
12. Generate an ad primary text.
13. Generate an ad headline.
14. Confirm the generated content is visible on the vehicle page.
15. Confirm the generated content appears in `/admin/facebook/content`.
16. Copy a generated content item and verify the clipboard value.
17. Copy the Messenger link from the vehicle page.
18. Open a published available public vehicle detail page.
19. Confirm the Messenger CTA appears when Messenger settings are configured.
20. Click the Messenger CTA and confirm a `lead_source_events` record is created with `event_name = messenger_cta_clicked`.
21. Confirm the Messenger click does not create a customer or inquiry.
22. Confirm the website inquiry form still works.
23. Confirm vehicles, customers, inquiries, and pipeline pages still work.
24. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
