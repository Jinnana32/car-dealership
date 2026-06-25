# Milestone 9B: Messenger Lead Conversion

Milestone 9B converts stored Messenger conversations into real CRM leads through an admin-assisted workflow.

Included:
- Messenger conversation statuses: `new`, `reviewed`, `converted`, `ignored`
- Messenger conversation list at `/admin/facebook/messenger`
- Messenger conversation detail at `/admin/facebook/messenger/[id]`
- Mark reviewed and ignore actions
- Manual conversion flow from Messenger conversation to customer + inquiry
- Duplicate customer detection by phone, email, and full name
- Vehicle prefill from Messenger referral context
- Conversation linking to `customer_id`, `inquiry_id`, and `vehicle_id`
- `lead_source_events` insert for `messenger_conversation_converted`

Not included:
- Chatbot auto-replies
- Outbound Messenger API messages
- Automatic inquiry creation from every Messenger message
- Facebook Lead Form webhook ingestion
- Brochures, reports, AI, or ad campaigns

Behavior:
- Messenger messages are still only potential leads when received.
- A Messenger conversation becomes a CRM inquiry only after a staff member converts it manually.
- Conversion reuses or creates a customer, creates an inquiry with `source_type = facebook_messenger`, updates the conversation to `converted`, and links the created inquiry back to the conversation.
- Converted inquiries continue into the normal inquiry list and pipeline flow.

Manual verification:
1. Open `/admin/facebook/messenger`.
2. Confirm the empty state appears if there are no stored conversations.
3. Confirm stored Messenger conversations render with status, latest message, and linked vehicle when present.
4. Open `/admin/facebook/messenger/[id]`.
5. Confirm inbound message history is visible.
6. Confirm referral ref and detected vehicle context are shown when available.
7. Mark a conversation as reviewed.
8. Ignore a conversation.
9. Open the convert-to-lead form.
10. Submit without customer name and confirm validation blocks conversion.
11. Submit with matching phone and confirm duplicate detection appears.
12. Submit with matching email and confirm duplicate detection appears.
13. Submit with matching full name and confirm duplicate detection appears.
14. Choose `Use Existing Customer` and confirm the inquiry links to that customer.
15. Choose `Create New Customer Anyway` and confirm a new customer is created.
16. Confirm the created inquiry has `source_type = facebook_messenger`.
17. Confirm the inquiry appears in `/admin/inquiries`.
18. Confirm the inquiry appears in `/admin/pipeline` under `New`.
19. Confirm an inquiry event exists for the conversion.
20. Confirm a `lead_source_events` row exists with `event_name = messenger_conversation_converted`.
21. Confirm the conversation status changes to `converted`.
22. Confirm the conversation links to the created inquiry.
23. Confirm website inquiry, manual lead entry, Facebook content, and Facebook Page publishing still work.
24. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
