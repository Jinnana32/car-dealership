# Milestone 14: Sales Hub and Payment Tracking

## Purpose

Milestone 12 introduced **deal closing** (`vehicle_sales`) and sales **reports**, but there is still no daily-use Sales area in the admin and no way to track money collected after a deal is closed.

This milestone adds:

1. A first-class **Sales** workspace for closed deals
2. Optional **payment plans** and **payment ledger** for cash and financing follow-up

Pipeline remains the place to work active leads. Sales becomes the place to review closed deals and outstanding balances.

## Relationship to Existing Work

Builds on:

- Milestone 12: `vehicle_sales`, `recordVehicleSale`, Reports → Sales
- Milestone 6+: inquiries, customers, pipeline
- Vehicle detail **Sales** tab (per-vehicle sale record)

Does not replace:

- Reports (analytics and CSV exports stay under `/admin/reports`)
- Inquiry detail pages (`/admin/inquiries/[id]`)
- Pipeline board/list (`/admin/pipeline`)

## Delivery Phases

This milestone is intentionally split into three vertical slices. Each slice should be shippable on its own.

### Phase A — Sales Hub (required)

Daily sales ledger in the main admin navigation.

### Phase B — Payment Plans (recommended for financing-heavy workflows)

Structured plan created when a sale is recorded or edited afterward.

### Phase C — Payment Ledger (recommended if staff must track collections)

Individual payment entries, balances, and overdue visibility.

Phase B and C can be deferred if the dealership only needs a visible sales list first.

---

## Phase A — Sales Hub

### Included

- Sidebar nav item: **Sales** → `/admin/sales`
- Sales list page (table-first)
  - Filters: date range, payment type, vehicle, customer search, recorded-by agent
  - Summary row: total sold amount, deal count, cash vs financing mix (filtered set)
- Sales detail page: `/admin/sales/[id]`
  - Vehicle, customer, inquiry links
  - Sold price, asking price, sold date, payment type, notes
  - Recorded by / created at
- Empty, loading, and not-found states
- Permission-aware UI
  - Owners/admins: full read
  - Sales agents: read sales tied to inquiries assigned to them, plus sales they recorded
- Reuse existing `vehicle_sales` data only (no new payment tables in Phase A)

### Routes

| Route | Purpose |
|---|---|
| `/admin/sales` | Sales list |
| `/admin/sales/[id]` | Sale detail |
| `/admin/sales/loading.tsx` | Loading state |
| `/admin/sales/[id]/loading.tsx` | Detail loading state |

### Not Included in Phase A

- Recording new payments after sale close
- Installment schedules
- Editing sold price from Sales detail (optional follow-up)
- New sale creation outside existing inquiry/vehicle flows

### Manual Verification — Phase A

1. Record a sale from an inquiry or vehicle Sales tab.
2. Open `/admin/sales` and confirm the sale appears.
3. Filter by payment type and date range.
4. Open the sale detail page and confirm vehicle, customer, and inquiry links work.
5. Confirm a sold vehicle no longer appears on the public website.
6. Confirm Reports → Sales still matches the same underlying data.
7. Log in as a sales agent and confirm access rules are enforced.
8. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

---

## Phase B — Payment Plans

### Included

- Database tables:
  - `sale_payment_plans`
  - optional `sale_payment_plan_events` for audit trail (recommended)
- One plan per `vehicle_sales` row
- Plan fields (initial set):
  - `plan_type`: `cash` | `financing` | `trade_in` | `mixed`
  - `total_amount` (defaults from `sold_price`)
  - `down_payment_amount`
  - `trade_in_amount` (nullable)
  - `financed_amount` (nullable)
  - `term_months` (nullable)
  - `monthly_payment` (nullable)
  - `financier_name` (nullable)
  - `balance_remaining` (derived or stored)
  - `status`: `pending` | `partially_paid` | `paid_in_full` | `overdue` | `cancelled`
- Extend **Record Sale** forms (pipeline panel, inquiry detail, vehicle Sales tab) to capture plan basics when payment type is financing or trade-in
- Sales detail page: **Payment plan** section
- Auto-create plan row when `recordVehicleSale` succeeds

### Not Included in Phase B

- Logging individual installment payments (Phase C)
- SMS/email reminders
- Bank sync
- Editing plan after multiple payments exist without guardrails

### Business Rules — Phase B

- Every new sale should have at most one active payment plan.
- `total_amount` should match `sold_price` unless an explicit adjustment note is recorded.
- Cash sales may create a simple plan with status `paid_in_full` when collected in full at closing.
- Financing sales should require down payment and term OR explicit “plan TBD” state — do not fake completed financing data.

### Manual Verification — Phase B

1. Record a cash sale and confirm plan status is `paid_in_full` or equivalent.
2. Record a financing sale with down payment and term; confirm plan row exists.
3. Open Sales detail and confirm plan summary is visible.
4. Confirm existing sales without plans remain readable (migration backfill or graceful empty state).
5. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

---

## Phase C — Payment Ledger

### Included

- Database table: `sale_payments`
  - `sale_id` → `vehicle_sales.id`
  - `plan_id` → `sale_payment_plans.id` (nullable but recommended)
  - `amount`
  - `paid_at`
  - `payment_method`: `cash` | `bank_transfer` | `check` | `gcash` | `other`
  - `reference_number` (nullable)
  - `notes` (nullable)
  - `recorded_by`
- Server actions:
  - `recordSalePayment`
  - optional `voidSalePayment` (admin only, soft void via status — no hard delete)
- Sales detail: payment history timeline
- Balance summary: paid to date / remaining balance
- Overdue indicator when expected installment date passes (if schedule rows exist)
- Optional table: `sale_payment_schedule_items` for expected installments
- Dashboard or Sales list badge: count of overdue balances
- CSV export route: `/api/reports/sale-payments.csv` (or extend sales CSV)

### Not Included in Phase C

- Automatic payment collection
- Customer self-service payment portal
- Accounting / GL export
- Interest calculation engine
- Multi-currency support

### Business Rules — Phase C

- Payments must never exceed remaining balance unless an admin override with note is recorded.
- Voided payments remain in audit history.
- Plan `status` updates automatically from ledger totals.
- Recording a payment does not change vehicle or inquiry status (sale is already closed).

### Manual Verification — Phase C

1. Create a financing sale with a known balance.
2. Record a partial payment and confirm balance decreases.
3. Record final payment and confirm status becomes `paid_in_full`.
4. Attempt to overpay and confirm validation blocks or requires admin override.
5. Void a payment as admin and confirm balance recalculates.
6. Export payments CSV and confirm amounts match UI.
7. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

---

## Proposed Database Additions (Phases B and C)

```txt
sale_payment_plans
  id
  dealership_id
  sale_id                    → vehicle_sales.id (unique)
  plan_type
  total_amount
  down_payment_amount
  trade_in_amount
  financed_amount
  term_months
  monthly_payment
  financier_name
  balance_remaining
  status
  notes
  created_at
  updated_at

sale_payment_schedule_items   (optional, Phase C)
  id
  dealership_id
  plan_id
  due_at
  amount_due
  status                      pending | paid | overdue | waived
  paid_payment_id             → sale_payments.id (nullable)

sale_payments
  id
  dealership_id
  sale_id
  plan_id
  amount
  paid_at
  payment_method
  reference_number
  notes
  status                      posted | voided
  recorded_by
  created_at
  updated_at
```

All tables must include `dealership_id`, `created_at`, and `updated_at` where appropriate.

## RLS and Permissions

Minimum pattern:

- Dealership members can read sales and payment data for their dealership.
- Owners and admins can create/update plans and record payments.
- Sales agents can read sales linked to their assigned inquiries or sales they recorded.
- Sales agents can record payments only when permitted on that sale (mirror `can_manage_vehicle_sale` rules).
- Public users have no direct access.

Never trust client-supplied `dealership_id`.

## Server Actions and API

| Action / Route | Phase |
|---|---|
| `getSalesList` / queries | A |
| `getSaleById` | A |
| `recordVehicleSale` (extend for plan payload) | B |
| `updateSalePaymentPlan` | B |
| `recordSalePayment` | C |
| `voidSalePayment` | C |
| `/api/reports/sale-payments.csv` | C |

Use Server Actions for admin mutations. Use route handlers for CSV export only.

## UI Placement

```txt
Sidebar
  Pipeline     ← active deals
  Sales        ← closed deals + balances (NEW)
  Customers
  Vehicles
  Reports      ← historical analytics
```

Sales list should follow the admin table-first pattern from `docs/admin-design-system.md`:

```txt
[Date filters] [Payment type] [Search] [Primary actions if any]
[Sales table]
[Summary bar]
```

## Inventory Rules (unchanged)

When a sale is recorded — same as Milestone 12:

- `vehicles.status` → `sold`
- `vehicles.availability` → `sold`
- Vehicle remains in admin inventory
- Vehicle is removed from public listings (`published` + `available` only)

Payment tracking must not unpublish or re-publish vehicles automatically.

## Explicitly Out of Scope

- Full accounting or invoicing
- Payroll or commission automation
- Payment gateway integration
- Customer-facing payment links
- AI-generated payment decisions
- Automatic pipeline stage changes from payment events
- Multi-dealership SaaS billing

Label any future placeholder UI as:

```txt
Coming soon
Not connected
Draft only
Manual export only
```

## Suggested Implementation Order

1. Migration + types + RLS (Phase B/C tables only when starting that phase)
2. Queries and validators
3. Server actions
4. `/admin/sales` list UI
5. `/admin/sales/[id]` detail UI
6. Navigation + permissions
7. Extend `recordVehicleSale` for plan capture
8. Payment ledger UI and actions
9. CSV export and dashboard summary
10. Documentation update in `docs/CLIENT_HANDOFF.md` when complete

## Completion Criteria

Phase A is complete when:

- [ ] Migration is not required for Phase A (uses existing `vehicle_sales`)
- [ ] RLS is considered for any new tables in B/C
- [ ] `/admin/sales` list and detail pages exist
- [ ] Empty/loading/error states exist
- [ ] Permissions are enforced server-side
- [ ] Manual test checklist for Phase A passes
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass

Full Milestone 14 is complete when Phases A, B, and C are done OR when Phase A is shipped and B/C are explicitly deferred in `CLIENT_HANDOFF.md` with client approval.

## Open Questions for Client (Best Wheels)

Resolve before Phase B:

1. Do they collect **in-house financing**, bank financing only, or both?
2. Is **down payment always upfront**, or can it be recorded later?
3. Do they need **installment due dates**, or only “amount paid so far”?
4. Should sales agents record payments, or admins only?
5. Is **GCash / bank transfer reference number** required on every payment?

Default recommendation if unanswered: Phase A now, Phase B with simple cash/financing plan fields, Phase C with manual payment logging only.
