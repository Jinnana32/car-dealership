# Milestone 5

Milestone 5 adds the operational sales pipeline for dealership inquiries.

## Included

- `pipeline_stages` table with dealership-scoped default stages
- Pipeline board and list views at `/admin/pipeline`
- Inquiry stage movement through existing inquiry statuses
- Explicit `marked_won` and `marked_lost` timeline events
- Lost-reason validation before moving an inquiry to `lost`
- Won confirmation before moving an inquiry to `won`
- Assignment, follow-up, and note actions from both the pipeline and inquiry detail views
- Follow-up state display for overdue, due today, future, and no follow-up
- Pipeline filters for status, source, vehicle, assignee, follow-up bucket, and text search

## Not Included

- Website inquiry form
- Facebook lead or Messenger ingestion
- PDF brochures
- Reports
- AI features
- Full sales reporting or `vehicle_sales` workflows

## Setup Notes

Apply the migration:

```bash
supabase db push
```

The migration seeds default stages for all existing dealerships and automatically seeds them for new dealerships later.

Default stages:

- `new`
- `contacted`
- `viewing_scheduled`
- `negotiation`
- `reserved`
- `won`
- `lost`

## Manual Verification

1. Open `/admin/pipeline`.
2. Confirm the page loads in board view by default.
3. Confirm a new inquiry appears under `New`.
4. Move the inquiry to `Contacted`.
5. Move the inquiry to `Viewing Scheduled`.
6. Move the inquiry to `Negotiation`.
7. Move the inquiry to `Reserved`.
8. Mark the inquiry as `Won` and confirm the action requires confirmation.
9. Create another inquiry and try marking it `Lost` without a reason; confirm it fails.
10. Mark that inquiry as `Lost` with a valid reason.
11. Confirm status changes appear in the inquiry timeline.
12. Add a note from the pipeline or inquiry detail page.
13. Confirm the note appears in the inquiry timeline.
14. Assign an inquiry to a sales agent and confirm the timeline records the assignment.
15. Set a follow-up date and confirm the timeline records it.
16. Confirm overdue, due today, future, and no follow-up states display correctly.
17. Test the pipeline filters for status, source, vehicle, assignee, follow-up bucket, and search.
18. Confirm sales agents only manage inquiries they are allowed to update.
19. Confirm customers, inquiries, vehicles, and public vehicle pages still work.
20. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
