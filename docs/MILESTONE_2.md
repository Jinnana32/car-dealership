# Milestone 2: Vehicle Inventory

Milestone 2 adds the internal vehicle inventory module for the admin panel.

## Included

- `vehicles` table with dealership scoping
- `vehicle_media` table for inventory photos
- private Supabase Storage bucket: `vehicle-media`
- dealership-scoped RLS for vehicles, vehicle media, and storage objects
- admin routes:
  - `/admin/vehicles`
  - `/admin/vehicles/new`
  - `/admin/vehicles/[id]`
  - `/admin/vehicles/[id]/edit`
- vehicle create, update, archive, status, availability, and featured-photo actions

## Storage Notes

The migration creates the `vehicle-media` bucket as a private bucket.

Vehicle uploads use this storage path pattern:

```txt
{dealership_id}/{vehicle_id}/{generated-file-name}
```

Current behavior:

- dealership members can read vehicle media through signed admin URLs
- owners and admins can upload and manage vehicle media
- public read is not enabled yet
- photo removal is not supported yet
- photo reordering is not supported yet

## Manual Verification

1. Open `/admin/vehicles` and confirm the page loads.
2. Confirm the empty state appears when the dealership has no vehicles.
3. Create a vehicle from `/admin/vehicles/new`.
4. Confirm validation blocks missing `title`, `brand`, and `model`.
5. Confirm the app redirects to `/admin/vehicles/[id]` after creation.
6. Edit the vehicle from `/admin/vehicles/[id]/edit`.
7. Upload one or more vehicle photos.
8. Set a featured photo from the detail or edit page.
9. Change status and availability from the vehicle detail page.
10. Archive the vehicle and confirm it no longer appears in the default active list.
11. Filter the list by `archived` and confirm the vehicle appears there.
12. Test search by title, brand, or stock number.
13. Confirm another dealership user cannot access this dealership’s vehicles.
14. Run `pnpm lint`.
15. Run `pnpm typecheck`.
16. Run `pnpm build`.
