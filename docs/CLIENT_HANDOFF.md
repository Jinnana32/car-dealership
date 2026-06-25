# Client Handoff

This guide explains the practical day-to-day flows for the dealership team.

## 1. How to log in

1. Open `/login`.
2. Enter the dealership admin email and password created in Supabase Auth.
3. If login fails, confirm the account exists and that the user has a dealership membership.

## 2. How to add a vehicle

1. Open `/admin/vehicles`.
2. Click `Add Vehicle`.
3. Fill in at least title, brand, and model.
4. Save the vehicle.
5. Open the vehicle detail page to upload photos and finish the listing.

## 3. How to publish a vehicle to the public site

1. Open the vehicle in `/admin/vehicles/[id]`.
2. Make sure price, description, and at least one photo are set.
3. Set the vehicle status to `published`.
4. Set availability to `available`.
5. Confirm the public listing appears at `/{dealerSlug}/vehicles/{vehicleSlug}`.

## 4. How to generate Facebook content

1. Open a vehicle detail page.
2. Go to the Facebook section.
3. Use:
   - `Generate Facebook Caption`
   - `Generate Marketplace Description`
   - `Generate Ad Primary Text`
   - `Generate Ad Headline`
4. Copy the generated text or review it later in `/admin/facebook/content`.

## 5. How to publish to the Facebook Page

1. Open `/admin/facebook/settings`.
2. Confirm the Page name, Page ID, and Messenger identifier are configured.
3. Make sure the production env has `META_PAGE_ACCESS_TOKEN`, `META_APP_SECRET`, `META_PAGE_ID`, and `NEXT_PUBLIC_SITE_URL`.
4. Open the vehicle detail page.
5. In the Facebook section, choose or edit the caption.
6. Confirm readiness is complete.
7. Use `Publish to Facebook` and confirm the action.
8. Review results in `/admin/facebook/published-posts`.

## 6. How to handle website inquiries

1. Public visitors submit the inquiry form from a public vehicle detail page.
2. New submissions appear in:
   - `/admin/inquiries`
   - `/admin/pipeline`
3. Open the inquiry.
4. Assign it, set follow-up, add notes, and move it through the pipeline.

## 7. How to handle Facebook Lead Form leads

1. Confirm the Meta webhook points to `/api/facebook/leadgen/webhook`.
2. Lead Form submissions are imported automatically.
3. Review imported records in `/admin/facebook/leads`.
4. Review form-to-vehicle mappings in `/admin/facebook/lead-forms`.
5. New processed leads should also appear in `/admin/inquiries` and `/admin/pipeline`.

## 8. How to convert Messenger conversations to leads

1. Open `/admin/facebook/messenger`.
2. Select a conversation.
3. Review the latest message and any detected vehicle context.
4. Click `Convert to Lead`.
5. Reuse an existing customer if the duplicate check suggests one.
6. Save the conversion.
7. The inquiry will appear in `/admin/inquiries` and `/admin/pipeline`.

## 9. How to manually add leads

1. Open `/admin/leads/new`.
2. Enter customer details and source.
3. Link a vehicle when relevant.
4. Save the lead.
5. If duplicate matches appear, choose whether to reuse the existing customer or create a new one.

## 10. How to move leads through the pipeline

1. Open `/admin/pipeline`.
2. Review board or list view.
3. Update the stage:
   - `New`
   - `Contacted`
   - `Viewing Scheduled`
   - `Negotiation`
   - `Reserved`
   - `Won`
   - `Lost`
4. Add notes and follow-up dates on the inquiry detail page.
5. When marking `Lost`, a lost reason is required.

## 11. How to record a sale

1. Open an inquiry with a linked vehicle.
2. Click `Mark as Won / Record Sale`.
3. Enter sold price and sold date.
4. Optionally set payment type and notes.
5. Save.
6. The system will:
   - create a sale record
   - mark the inquiry as `won`
   - mark the vehicle as `sold`

## 12. How to generate brochures

1. Open `/admin/brochures/new` for single or multi-vehicle brochures.
2. Or open a vehicle detail page and use the brochure action there.
3. Choose vehicles and brochure options.
4. Generate the PDF.
5. Download from `/admin/brochures`.

## 13. How to export reports

1. Open `/admin/reports`.
2. Choose the report:
   - Sales
   - Inventory
   - Inquiries
   - Lead Sources
   - Pipeline
3. Apply filters as needed.
4. Use `Export CSV`.

## 14. How to use AI Sales Analyst

1. Open `/admin/ai`.
2. If setup is complete, ask a business question or use a suggested question.
3. Use AI for:
   - inventory insights
   - sales summaries
   - follow-up priorities
   - lead source performance
   - Facebook caption drafts
4. AI is read-only. It does not modify data or publish content.

## 15. What to do if Facebook integration fails

Check:

1. `/admin/facebook/settings`
2. `META_PAGE_ACCESS_TOKEN`
3. `META_PAGE_ID`
4. `META_GRAPH_API_VERSION`
5. `META_WEBHOOK_VERIFY_TOKEN`
6. Meta webhook URLs

Then review:

1. `/admin/facebook`
2. `/admin/facebook/published-posts`
3. `/admin/facebook/leads`
4. `/admin/facebook/messenger`

Failed publish attempts and failed webhook processing should be visible there.

## 16. What to do if AI is not configured

1. Open `/admin/ai`.
2. If the setup card says AI is not configured, add `OPENAI_API_KEY` to the server environment.
3. Redeploy or restart the app.
4. Reload `/admin/ai`.

## First setup references

For the first dealership owner and initial records, use:

- [docs/MILESTONE_1_SETUP.md](/Users/tjcoyoca/Documents/car-dealership/docs/MILESTONE_1_SETUP.md)

For deployment and go-live checks, use:

- [docs/PRODUCTION_READINESS.md](/Users/tjcoyoca/Documents/car-dealership/docs/PRODUCTION_READINESS.md)
