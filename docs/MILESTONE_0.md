# Milestone 0

This milestone sets up the project foundation only.

Implemented:

- Next.js App Router project scaffold
- TypeScript, Tailwind CSS, ESLint, and package scripts
- `shadcn/ui` base configuration and core UI primitives used by the placeholder shell
- Supabase browser, server, and service-role clients
- Admin and public route groups
- Placeholder admin dashboard
- Draft-only public placeholder routes

Not implemented:

- Vehicles
- Leads and inquiries
- Facebook / Meta integration
- PDF brochures
- Reports
- AI Sales Analyst

## Environment

Required for Supabase runtime use:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

These values are documented in [.env.example](/Users/tjcoyoca/Documents/car-dealership/.env.example).

## Base Routes

- `/`
- `/dashboard`
- `/[dealerSlug]`
- `/[dealerSlug]/vehicles`
- `/[dealerSlug]/vehicles/[vehicleSlug]`

Suggested local draft route:

```txt
/sample-motors
```

## Manual Test Checklist

1. Run `pnpm install`.
2. Run `pnpm dev`.
3. Open `/` and confirm the foundation landing page renders.
4. Open `/dashboard` and confirm the admin shell, sidebar, top nav, and placeholder dashboard render.
5. Open `/sample-motors` and confirm the public draft page renders with a `Draft only` label.
6. Open `/sample-motors/vehicles` and `/sample-motors/vehicles/sample-sedan` and confirm both placeholder routes render.
7. Verify future admin modules appear as `Coming soon` instead of fake working pages.
8. Confirm no vehicle, inquiry, Facebook, PDF, report, or AI flows are implemented.
9. Run `pnpm lint`.
10. Run `pnpm typecheck`.
11. Run `pnpm build`.

