# Milestone 13: AI Sales Analyst

## Scope

This milestone adds a read-only AI analyst for dealership owners and admins.

Implemented:

- `/admin/ai`
- Suggested AI business questions
- Structured dealership context builder
- Server-side OpenAI Responses API call
- Stored AI chat sessions and messages
- Setup-required state when `OPENAI_API_KEY` is missing

Not implemented:

- Any record mutation through AI
- Automatic Facebook publishing
- Automatic ad launch
- Messenger replies or chatbot automation
- Customer messaging

## Data Flow

1. Admin opens `/admin/ai`.
2. Server validates dealership membership and AI permission.
3. Server builds a structured dealership summary from inventory, inquiries, sales, Facebook, Messenger, leads, brochures, and reports data.
4. Server sends the question plus the structured context to OpenAI.
5. The UI shows the read-only answer and stores the chat history.

## Security Notes

- `OPENAI_API_KEY` is only used server-side.
- AI context is dealership-scoped.
- The AI page is limited to `owner` and `admin` roles.
- The AI context avoids full raw customer exports and does not send phone or email lists by default.
- The model is instructed to stay read-only and to avoid claiming actions it did not perform.

## Database Additions

- `ai_chat_sessions`
- `ai_chat_messages`

Both tables are dealership-scoped and protected with RLS.

## Verification

Run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```
