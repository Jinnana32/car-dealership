# Milestone 3: Public Vehicle Website

Milestone 3 adds the public-facing dealership website for browsing published vehicles.

## Included

- public dealership homepage:
  - `/[dealerSlug]`
- public inventory listing:
  - `/[dealerSlug]/vehicles`
- public vehicle detail page:
  - `/[dealerSlug]/vehicles/[vehicleSlug]`
- public-safe vehicle and dealership queries
- public metadata for homepage, listing, and detail pages
- missing dealership and missing vehicle states
- placeholder CTAs for inquiry, Messenger, and brochure features

## Public Data Rules

Only vehicles with both of these conditions are shown publicly:

```txt
status = published
availability = available
```

Draft, reserved, sold, archived, and unavailable vehicles are excluded from public pages.

Public pages do not expose:

```txt
vin
plate_number
created_by
storage_path
internal admin metadata
```

## RLS Notes

Milestone 3 adds safe public select policies for:

- `dealerships`
- `vehicles`
- `vehicle_media`

Vehicle public read remains restricted to published and available rows.

Vehicle image files remain in the private `vehicle-media` bucket. Public pages use short-lived signed URLs generated server-side for the published media that is already allowed by RLS.

## Manual Verification

1. Publish a vehicle and set availability to `available`.
2. Open `/{dealerSlug}` and confirm the vehicle appears in the featured section.
3. Open `/{dealerSlug}/vehicles` and confirm the vehicle appears in the listing.
4. Change the same vehicle to `draft` and confirm it disappears publicly.
5. Change the same vehicle to `reserved` and confirm it disappears publicly.
6. Change the same vehicle to `sold` and confirm it disappears publicly.
7. Change the same vehicle to `archived` and confirm it disappears publicly.
8. Remove all photos from a test vehicle record and confirm the public placeholder renders without breaking layout.
9. Open `/{dealerSlug}/vehicles/{vehicleSlug}` and confirm the detail page shows gallery, specs, price, and description.
10. Open a wrong dealership slug and confirm the dealership not found state appears.
11. Open a wrong vehicle slug under a valid dealership and confirm the vehicle not found state appears.
12. Check the public pages at a narrow mobile width.
13. Confirm `/admin/*` routes still work after the public changes.
14. Run `pnpm lint`.
15. Run `pnpm typecheck`.
16. Run `pnpm build`.
