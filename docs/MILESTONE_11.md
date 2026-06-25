# Milestone 11

## Scope

Implemented PDF brochure generation only.

Included:

- `brochure_exports` tracking
- private `brochures` storage bucket
- single-vehicle brochure generation
- multi-vehicle brochure generation
- server-side PDF rendering with `@react-pdf/renderer`
- QR code support for public vehicle URLs when available
- brochure history page
- brochure generator page
- vehicle detail brochure actions and recent history
- signed brochure download route

Not included:

- reports
- AI-generated brochure copy
- email sending
- Facebook auto-sharing
- customer portal flows
- advanced brochure template editing

## Generation Flow

1. An authenticated admin or sales agent opens `/admin/brochures/new` or a vehicle detail page.
2. The app validates brochure options and selected vehicles server-side.
3. Vehicle data is loaded only for the current dealership.
4. The server renders the brochure PDF using `@react-pdf/renderer`.
5. Public vehicle URLs are added only when `NEXT_PUBLIC_SITE_URL` exists and the vehicle is `published` and `available`.
6. QR codes are generated only when a usable public vehicle URL exists.
7. The finished PDF is uploaded to the private `brochures` bucket.
8. A `brochure_exports` row is updated with storage metadata and status.
9. Download requests use a short-lived signed URL from `/api/brochures/[id]/download`.

## Storage Notes

The milestone migration creates the `brochures` bucket and dealership-scoped storage policies.

- Bucket: `brochures`
- Access: dealership members can read their own dealership brochures
- Uploads: internal authenticated roles generate brochures server-side only

No service role key is exposed in the browser.

## PDF Content Rules

Single-vehicle brochures include:

- dealership name and logo when available
- dealership contact details
- generated date
- featured image
- title and core specs
- price when enabled
- description
- public vehicle URL when available
- QR code when enabled and available
- disclaimer when enabled

Multi-vehicle brochures include the same dealership header plus one vehicle section per page for the selected set.

Brochures intentionally do not expose:

- VIN
- plate number
- private storage paths
- creator IDs
- internal metadata

## Environment Notes

`NEXT_PUBLIC_SITE_URL` is recommended so brochures can include public vehicle links and QR codes.

If it is missing, brochure generation still succeeds, but public URLs and QR codes are omitted.
