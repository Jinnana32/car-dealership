# Milestone 8

Milestone 8 adds controlled Facebook Page publishing for vehicle posts.

## Included

- `facebook_post_publications` table for publish history
- `facebook_api_logs` table for sanitized Facebook API debugging
- Server-only Meta Graph API helper in `lib/facebook/server.ts`
- Vehicle-level Facebook Page publish flow with explicit confirmation
- Text + link post publishing from `/admin/vehicles/[id]`
- Facebook publish readiness checklist
- Publish history on the vehicle page
- Published posts history page at `/admin/facebook/published-posts`
- Facebook Sales Hub overview updates for published and failed Page posts

## Not Included

- Facebook Lead Form webhook ingestion
- Messenger webhook or chatbot handling
- Facebook ad campaign creation
- Facebook ad drafts
- AI-generated captions
- PDF brochures
- Reports

## Environment

Add these variables for Page publishing:

```bash
NEXT_PUBLIC_SITE_URL=
META_PAGE_ACCESS_TOKEN=
META_PAGE_ID=
META_GRAPH_API_VERSION=
```

Publishing behavior:

- `facebook_connections.page_id` takes precedence when it is configured.
- `META_PAGE_ID` is the fallback when no dealership-specific page ID is saved.
- `META_PAGE_ACCESS_TOKEN` is server-only and is never exposed to the browser.
- `META_GRAPH_API_VERSION` is read server-side for Graph API publish requests.

## Publish Notes

- The first live publish path is `text_link_post`.
- `photo_post` remains disabled until the image delivery path is safe for Meta to fetch directly.
- Publishing is allowed only for `published` and `available` vehicles.
- Each publish attempt creates a publication record and a sanitized API log.

## Manual Verification

1. Open `/admin/vehicles/[id]`.
2. Confirm the Facebook publish readiness checklist appears.
3. Remove `META_PAGE_ACCESS_TOKEN` and confirm publishing is disabled by readiness.
4. Remove `NEXT_PUBLIC_SITE_URL` and confirm publishing is disabled by readiness.
5. Change a vehicle to `draft` and confirm it cannot be published.
6. Change a vehicle to `reserved` and confirm it cannot be published.
7. Change a vehicle to `sold` and confirm it cannot be published.
8. Change a vehicle to `published` and `available`.
9. Generate or select a Facebook caption.
10. Confirm the publish checkbox and publish confirmation dialog appear.
11. Publish using `Text + Link Post`.
12. Confirm a `facebook_post_publications` row is created.
13. Confirm a `facebook_api_logs` row is created.
14. Force a publish failure and confirm the publication is marked `failed`.
15. Confirm failed publishes also create sanitized API logs.
16. Confirm publish history appears on the vehicle page.
17. Open `/admin/facebook/published-posts`.
18. Confirm the published posts page loads and shows history.
19. Confirm no raw token appears in the browser UI or database log payloads.
20. Confirm the Facebook Sales Hub overview shows recent published and failed activity.
21. Confirm the website inquiry form still works.
22. Confirm Messenger CTA tracking still works.
23. Confirm vehicles, customers, inquiries, and pipeline still work.
24. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
