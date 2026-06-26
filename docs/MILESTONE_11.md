# Milestone 11 — Facebook Post Comments → Auto Inquiry

## Goal

When a customer comments on a Facebook Page post published from this app, automatically:

1. Store the comment
2. Create or reuse a customer (matched by Facebook author ID when available)
3. Create a new inquiry with `source_type = facebook_comment`
4. Link the vehicle when the comment is on a tracked published post

## Database

- `facebook_post_comments` — comment import tracking and CRM links
- `facebook_webhook_events.event_source` — extended with `comment`

Migration: `supabase/migrations/20260626120000_milestone_11_facebook_post_comments.sql`

## API

- `GET/POST /api/facebook/webhook` — **recommended Meta callback URL** (handles leadgen, messenger, and comments)
- `GET/POST /api/facebook/comments/webhook` — comments-only endpoint (legacy / direct)
- Subscribe Page webhook field: **`feed`**
- Processes `item=comment` + `verb=add` only

## Admin UI

- `/admin/facebook/comments` — import history, status, retry failed rows
- Hub link: **Post Comments**

## Meta setup checklist

1. In Meta App → Webhooks → Page, add callback URL:
   - **Recommended:** `https://YOUR_DOMAIN/api/facebook/webhook`
   - Comments-only (optional): `https://YOUR_DOMAIN/api/facebook/comments/webhook`
2. Verify token: same `META_WEBHOOK_VERIFY_TOKEN` as other webhooks
3. Subscribe to **`feed`**
4. Ensure Page token permissions include:
   - `pages_manage_metadata`
   - `pages_read_engagement`
   - `pages_manage_posts` (already used for publishing)
5. Publish vehicles through the app so `facebook_post_publications.facebook_post_id` can link comments to inventory

## Processing rules

- **One inquiry per comment** (duplicate Facebook comment IDs are ignored)
- **Page-authored comments** are ignored
- **Empty comments** are ignored
- **Vehicle linking** uses `facebook_post_publications` exact or fuzzy post ID match
- **Customer reuse** uses prior `facebook_post_comments.author_facebook_id` when available

## Manual test checklist

- [ ] Webhook verification GET returns challenge
- [ ] Comment on a published vehicle post creates row in `facebook_post_comments`
- [ ] Customer + inquiry appear in pipeline with source Facebook Comment
- [ ] Duplicate webhook delivery does not create duplicate inquiries
- [ ] Failed row can be retried from `/admin/facebook/comments`

## Notes

- Comments rarely include phone/email; staff should follow up in Facebook or Messenger
- Only posts published through this app (or with matching `facebook_post_id`) auto-link to a vehicle
