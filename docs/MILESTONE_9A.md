# Milestone 9A: Messenger Webhook Foundation

Milestone 9A adds the safe inbound Messenger storage foundation only.

Included:
- `facebook_webhook_events` raw Messenger webhook event storage
- `messenger_conversations`
- `messenger_messages`
- Messenger webhook GET verification at `/api/facebook/messenger/webhook`
- Inbound Messenger message storage
- `lead_source_events` creation for inbound Messenger messages
- Admin Messenger inbox at `/admin/facebook/messenger`
- Sanitized Facebook API log rows for webhook processing

Not included:
- Automatic customer creation from Messenger
- Automatic inquiry creation from Messenger
- Outbound Messenger replies
- Chatbot automation
- Facebook Lead Form webhook ingestion
- Brochures, reports, AI, or ad campaigns

Environment:
- `META_WEBHOOK_VERIFY_TOKEN` must be configured for GET verification.
- `META_PAGE_ID` and the Facebook connection `page_id` should match the dealership Page used for webhook delivery.

Webhook behavior:
- GET verifies the Messenger webhook subscription.
- POST stores each inbound event in `facebook_webhook_events` before conversation/message processing.
- Only inbound Messenger messages are stored as `messenger_messages`.
- Non-message and echo events are logged and marked ignored.
- Referral values such as `vehicle_{vehicleId}` or `vehicle_{vehicleSlug}` are preserved in metadata.
- Inbound messages create `lead_source_events` with `source_type = facebook_messenger` and `event_name = messenger_message_received`.
- No `customers` or `inquiries` are created yet from Messenger webhook traffic.

Manual verification:
1. Set `META_WEBHOOK_VERIFY_TOKEN` in local env.
2. Call `GET /api/facebook/messenger/webhook` with `hub.mode=subscribe`, a matching `hub.verify_token`, and `hub.challenge`, then confirm the raw challenge string is returned.
3. POST a sample Messenger inbound message payload to `/api/facebook/messenger/webhook`.
4. Confirm a `facebook_webhook_events` row is created.
5. Confirm a `messenger_conversations` row is created or updated.
6. Confirm a `messenger_messages` row is created with sender PSID, page ID, message text, and timestamp.
7. Confirm a `lead_source_events` row is created with `messenger_message_received`.
8. Confirm no `customers` or `inquiries` are created automatically.
9. Open `/admin/facebook/messenger` and confirm the conversation and message appear.
10. Confirm website inquiry, vehicles, pipeline, and Facebook Page publishing still work.
11. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
