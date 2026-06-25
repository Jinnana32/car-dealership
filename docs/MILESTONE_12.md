# Milestone 12

## Scope

Implemented sales closing and reports only.

Included:

- `vehicle_sales` table with dealership-scoped RLS
- inquiry-to-sale closing flow
- vehicle detail sale-recording flow
- automatic vehicle `sold` status and availability updates
- inquiry `won` updates when a sale is recorded from an inquiry
- reports overview
- sales report
- inventory report
- inquiry report
- lead source report
- pipeline report
- CSV export routes for every report

Not included:

- AI Sales Analyst
- Facebook ads or campaign reporting
- ad spend sync
- accounting or invoicing
- payroll
- predictive forecasting

## Sales Closing Flow

1. Staff opens an inquiry with a linked vehicle or opens a vehicle detail page.
2. The sale form is submitted through a server action.
3. The server validates the payload with Zod.
4. The dealership and role context is derived from the authenticated admin session.
5. The app confirms the selected vehicle belongs to the dealership and is not already sold.
6. A `vehicle_sales` record is created.
7. The vehicle is updated to `status = sold` and `availability = sold`.
8. If an inquiry is linked, the inquiry is marked `won`.
9. An inquiry event is written with the sale context.
10. Report pages and public vehicle surfaces are revalidated.

Sales agents can only record a sale when they are working from an assigned inquiry. Owners and admins can record sales directly.

## Reports

Routes added:

- `/admin/reports`
- `/admin/reports/sales`
- `/admin/reports/inventory`
- `/admin/reports/inquiries`
- `/admin/reports/lead-sources`
- `/admin/reports/pipeline`

CSV routes added:

- `/api/reports/sales.csv`
- `/api/reports/inventory.csv`
- `/api/reports/inquiries.csv`
- `/api/reports/lead-sources.csv`
- `/api/reports/pipeline.csv`

All reports use real dealership data only. No placeholder metrics are generated.

## Business Rules

- A vehicle can only have one final sale record per dealership.
- Sold vehicles remain visible in admin inventory.
- Sold vehicles no longer qualify for the public available inventory.
- Won inquiries remain visible in inquiry history and the CRM.
- Lead source performance is calculated from real inquiries and linked sales.

## Security Notes

- Report access is limited to owners and admins in the UI and route handlers.
- CSV exports require an authenticated admin session.
- No service-role key is exposed client-side.
- Sales creation never trusts a client-supplied `dealership_id`.
