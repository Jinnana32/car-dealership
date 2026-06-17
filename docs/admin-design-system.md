# Admin Panel Design System

This document defines the visual and UX standards for the admin panel.

The admin UI should follow the design direction of the reference image located at:

`designs/reference.png`

The goal is a clean, modern, spacious, professional dealership/admin interface. The design should feel like a polished SaaS dashboard: minimal text, strong hierarchy, clear tables, useful actions, and no unnecessary clutter.

---

## 1. Core Design Direction

The admin panel should be:

- Modern
- Clean
- Spacious
- Professional
- Easy to scan
- Table-first for data-heavy pages
- Minimal in copy/text
- Consistent across all modules

Avoid making pages feel like landing pages. This is an admin system, so the UI should be functional, lean, and direct.

Do not add long descriptions, marketing copy, or repeated explanations on every page.

Bad:

```txt
Vehicle Inventory
Manage all your vehicles here. You can add, edit, delete, publish, unpublish, and organize your dealership inventory from this section.
```

Good:

```txt
Inventory
```

Or in many cases, no large page title is needed if the sidebar and active tab already explain the location.

---

## 2. Layout Structure

Use a consistent admin shell:

```txt
Left Sidebar
Top Navigation Bar
Main Content Area
```

The layout should resemble the reference image:

- Fixed left sidebar
- Lean top navbar
- Main content contained in a white/light surface
- Clear spacing between navigation and page content
- Page content should not feel cramped
- Use subtle borders instead of heavy shadows
- Use rounded corners where appropriate

Recommended structure:

```tsx
<AppShell>
  <Sidebar />
  <MainArea>
    <TopNav />
    <PageContent />
  </MainArea>
</AppShell>
```

---

## 3. Sidebar Standards

The sidebar should be the primary navigation area.

### Sidebar Behavior

- Sidebar should be clean and organized.
- Use icons + labels for main sections.
- Group related pages under collapsible parent items.
- Highlight the active page clearly.
- Do not overload the sidebar with too many top-level items.
- Prefer nested navigation when pages belong together.

Example structure:

```txt
Dashboard

Inventory
  Vehicles
  Add/Edit Vehicle
  Categories
  Brands

Inquiries
  Leads
  Customers
  Follow-ups

Sales
  Deals
  Reservations
  Payments

Marketing
  Facebook Posts
  Campaigns
  Templates

Reports
  Sales Reports
  Inventory Reports
  Lead Reports

Settings
  Dealership Profile
  Users & Roles
  Integrations
```

### Active State

The active item should be obvious but not loud.

Use:

- Light tinted background
- Accent-colored text
- Small indicator or left border
- Icon color change

Avoid:

- Heavy gradients
- Large shadows
- Overly bright backgrounds
- Multiple competing active indicators

### Sidebar Copy

Keep labels short.

Good:

```txt
Vehicles
Inquiries
Reports
Settings
```

Bad:

```txt
Manage Vehicle Inventory
Customer Inquiry Management
Detailed Business Analytics Reports
Application Configuration Settings
```

---

## 4. Top Navigation Bar Standards

The top nav should be lean and functional.

It should contain only useful global actions, such as:

- Search
- Language selector, if needed
- Notifications
- Quick add button, if needed
- User/account menu

Do not add redundant breadcrumbs, large titles, or explanatory text unless truly necessary.

Recommended layout:

```txt
[Search]                                      [Notifications] [User]
```

The top nav should not compete with the sidebar.

---

## 5. Page Header Standards

Avoid repetitive page headers.

Do not create a big title and subtitle on every admin page when the sidebar already shows where the user is.

### Use compact headers only when needed

Good:

```txt
Vehicles              [Add Vehicle]
```

Bad:

```txt
Vehicle Inventory Management
Manage all vehicle records, statuses, pricing information, and publishing options for your dealership inventory.
```

### When to use a page title

Use a title when:

- The page is a major section
- The current context is not obvious
- The page has multiple tabs
- The page is a detail page

### When not to use a title

Avoid large page titles when:

- The sidebar item already explains the page
- The tab title already explains the section
- The content is mostly a table with obvious columns

---

## 6. Tabs Standards

Use tabs for related content within the same module.

Tabs should feel like the reference image:

```txt
General | Pricing | Comments
```

For the dealership admin, examples:

### Vehicle Detail Page

```txt
General | Pricing | Photos | Documents | Facebook | Activity
```

### Inquiries Page

```txt
All | New | Contacted | Scheduled | Closed
```

### Settings Page

```txt
Profile | Users | Integrations | Billing
```

### Reports Page

```txt
Sales | Inventory | Inquiries | Staff
```

Tabs should be used only when the content is related.

Do not use tabs for unrelated pages just to make the UI look complex.

---

## 7. Table Page Standards

Most admin list pages should be table-first.

A table page should usually contain:

```txt
Tabs, if applicable
Toolbar
Table
Pagination
```

Recommended pattern:

```txt
[Search] [Filters] [Group by]                         [Add Vehicle]

| Checkbox | Vehicle | Status | Price | Mileage | Published | Actions |
|----------|---------|--------|-------|---------|-----------|---------|

Showing 10 of 120                              [Pagination]
```

### Required table features

For data-heavy pages, include:

- Search
- Filters
- Add button, if the resource can be added
- Pagination
- Row actions
- Empty state
- Loading state
- Error state

### Search

Search should be placed in the table toolbar.

Examples:

```txt
Search vehicles
Search inquiries
Search customers
```

### Filters

Use filters for meaningful fields only.

Examples for vehicles:

- Status
- Brand
- Body type
- Price range
- Published/unpublished
- Sold/available

Examples for inquiries:

- Status
- Source
- Assigned staff
- Date range

### Add Button

If a resource can be created, place the primary add button on the upper-right of the table toolbar.

Examples:

```txt
+ Add Vehicle
+ Add Customer
+ Add Inquiry
+ Add User
```

Do not scatter multiple add buttons around the page.

---

## 8. Table Visual Style

Tables should be clean and easy to scan.

Use:

- Subtle header background
- Light row dividers
- Consistent row height
- Clear column alignment
- Compact action menu
- Status badges
- Toggle switches only when the action is immediate and clear

Avoid:

- Heavy borders around every cell
- Oversized text
- Too many colors
- Too many buttons inside each row
- Long paragraphs inside table cells

### Row Actions

Prefer a kebab menu or compact action area:

```txt
View
Edit
Duplicate
Publish
Delete
```

Do not show five large buttons in each row.

### Status Badges

Use small, readable badges.

Examples:

```txt
Draft
Published
Sold
Reserved
Archived
```

Badge styling should be consistent across the app.

---

## 9. Forms Standards

Forms should be clean and grouped logically.

Avoid one long vertical form when the page contains many fields.

For complex forms, use tabs or sections.

Example for vehicles:

```txt
General
- Make
- Model
- Year
- VIN
- Plate Number

Pricing
- Selling Price
- Discount
- Financing Notes

Specs
- Mileage
- Transmission
- Fuel Type
- Engine
- Color

Photos
- Upload photos
- Reorder photos
- Mark cover photo

Publishing
- Website visibility
- Facebook post status
```

### Form Layout

Use a two-column layout on desktop when fields are short.

Use one column on mobile.

Example:

```txt
[Make]          [Model]
[Year]          [Mileage]
[Transmission]  [Fuel Type]
```

Do not make every input full-width unless the field needs it.

---

## 10. Detail Page Standards

Detail pages should prioritize the main object first.

Example vehicle detail page:

```txt
Toyota Fortuner 2022                  [Edit] [Post to Facebook]

Status: Published
Price: ₱1,450,000
Mileage: 35,000 km

Tabs:
General | Pricing | Photos | Inquiries | Facebook | Activity
```

Keep the top summary compact.

Do not add large banners unless useful.

---

## 11. Empty States

Empty states should be simple and actionable.

Good:

```txt
No vehicles yet.
Add your first vehicle to start building your inventory.

[Add Vehicle]
```

Bad:

```txt
Welcome to your vehicle management experience. This powerful module allows you to control and organize your dealership inventory...
```

Empty states should include one primary action when possible.

---

## 12. Loading and Error States

Every data page must have clear loading and error states.

### Loading

Use skeleton rows for tables.

Do not show broken empty tables while loading.

### Error

Use a compact error message with retry.

Example:

```txt
Unable to load vehicles.
[Retry]
```

Do not expose raw technical errors to normal users.

---

## 13. Buttons

Use clear button hierarchy.

### Primary Button

Use for the main page action.

Examples:

```txt
Add Vehicle
Save Changes
Post to Facebook
```

### Secondary Button

Use for supporting actions.

Examples:

```txt
Cancel
Preview
Export
```

### Destructive Button

Use only for destructive actions.

Examples:

```txt
Delete
Archive
Remove
```

Destructive actions should require confirmation.

---

## 14. Copywriting Rules

Admin copy should be short and direct.

Use action labels:

```txt
Add Vehicle
Save Changes
Post to Facebook
View Inquiry
Mark as Sold
```

Avoid vague labels:

```txt
Submit
Proceed
Manage
Click Here
```

Avoid repeated descriptions.

Bad:

```txt
This section allows you to manage the vehicles that are currently available in your dealership inventory.
```

Good:

```txt
Available Vehicles
```

---

## 15. Spacing and Density

The UI should feel spacious but not wasteful.

Use:

- Consistent padding
- Clear separation between toolbar, table, and pagination
- Compact table rows
- Enough white space to make scanning easy

Suggested Tailwind spacing:

```txt
Page padding: p-6 or p-8
Card padding: p-4 or p-6
Toolbar gap: gap-3 or gap-4
Table row height: h-12 to h-14
```

Avoid:

- Large vertical gaps between simple elements
- Huge page headers
- Multiple stacked cards when one table is enough
- Overly tall buttons or inputs

---

## 16. Color System

Use a restrained color palette.

Recommended:

```txt
Background: off-white / light gray
Surface: white
Text primary: near-black
Text secondary: muted gray
Border: light gray
Accent: brand color
Danger: red
Success: green
Warning: orange/yellow
```

Use brand color mainly for:

- Active sidebar item
- Primary buttons
- Active tab underline
- Important selected states

Do not overuse brand color on every element.

---

## 17. Cards

Use cards only when they improve grouping.

Good card usage:

- Dashboard metric cards
- Settings integration cards
- Summary panels
- Detail page side panels

Bad card usage:

- Wrapping every table row in a card on desktop
- Creating many cards for simple navigation
- Using cards just to fill space

---

## 18. Dashboard Standards

Dashboard should show high-value summaries only.

Recommended sections:

```txt
Metric cards:
- Available Vehicles
- New Inquiries
- Reserved Vehicles
- Sold This Month

Recent activity:
- Latest inquiries
- Recently added vehicles
- Pending follow-ups
```

Do not overload the dashboard with every possible chart.

Start simple and useful.

---

## 19. Integrations Page Standards

The integrations page should use clean cards.

Example:

```txt
Facebook Page
Connected to: ABC Motors
Status: Connected
[Manage]

Google Calendar
Status: Not Connected
[Connect]
```

Integration cards should show:

- Integration name
- Short purpose
- Connection status
- Primary action

Do not add long explanations.

---

## 20. Facebook Posting UI Standards

For the Facebook integration, keep the flow simple.

Vehicle page:

```txt
Facebook
Status: Not Posted

[Generate Caption]
[Post to Facebook Page]
```

After posting:

```txt
Facebook
Status: Posted
Posted on: Jan 15, 2026

[View Post]
[Repost]
```

While API approval is not ready, provide manual fallback:

```txt
Generated Caption
[Copy Caption]
[Download Photos]
[Open Facebook Page]
```

Do not make the user understand Meta API complexity inside the admin UI.

The admin should only see clear statuses:

```txt
Not Connected
Connected
Ready to Post
Posted
Failed
Needs Reconnect
```

---

## 21. Responsive Behavior

The admin panel should work on desktop and tablet first.

Mobile should remain usable, but dense admin workflows can be simplified.

### Desktop

- Sidebar visible
- Tables visible
- Multi-column forms allowed

### Tablet

- Sidebar can collapse
- Tables can horizontally scroll
- Forms may become single-column

### Mobile

- Sidebar becomes drawer
- Tables can become scrollable or card-based
- Primary actions remain accessible

Never let tables break the page width.

Use horizontal scroll when needed.

---

## 22. Accessibility

Maintain basic accessibility standards:

- Buttons must have clear labels
- Icon-only buttons need accessible labels
- Inputs must have labels
- Text should have sufficient contrast
- Focus states should be visible
- Do not rely on color alone for status

Status badges should include text, not color only.

Good:

```txt
Published
Draft
Sold
```

Bad:

```txt
Green dot only
Red dot only
```

---

## 23. Component Standards

Prefer reusable components.

Recommended components:

```txt
AdminShell
Sidebar
TopNav
PageTabs
TableToolbar
DataTable
StatusBadge
EmptyState
ConfirmDialog
FormSection
IntegrationCard
```

Avoid one-off UI patterns unless necessary.

---

## 24. Page Pattern Templates

### Standard List Page

Use this pattern for vehicles, inquiries, customers, users, reports, and similar resources.

```txt
[Optional Tabs]

[Search] [Filters] [Group By]                    [Add Item]

[Data Table]

Showing 10 of 100                                [Pagination]
```

### Standard Detail Page

```txt
[Object Name]                         [Primary Action] [More Actions]

Compact summary row

[Tabs]

[Selected tab content]
```

### Standard Settings Page

```txt
[Settings Tabs]

[Simple forms or integration cards]

[Save Changes]
```

---

## 25. Do Not Do These

Do not:

- Add long explanatory text on every page
- Add redundant page headers
- Use too many cards when a table is better
- Put multiple primary buttons in the same toolbar
- Show raw API errors to users
- Use large hero sections inside admin pages
- Create inconsistent spacing per page
- Use different table styles across modules
- Add tabs for unrelated pages
- Add decorative elements that do not help usability
- Overcomplicate the first version

---

## 26. Agent Implementation Instruction

When implementing admin UI, always check the page against these questions:

1. Is the page clean and easy to scan?
2. Is the main action obvious?
3. Is there any redundant title or description?
4. Can the user search/filter data when needed?
5. Does the table have pagination?
6. Are actions placed consistently?
7. Are related sections grouped with tabs?
8. Does the sidebar clearly show where the user is?
9. Is the top nav lean and useful?
10. Does the UI match the visual direction of `designs/reference.png`?

If the answer is no, revise the UI before moving on.

---

## 27. Final Design Principle

The admin panel should feel like a serious, modern operating system for a dealership.

It should not feel like a template full of filler text.

Prioritize clarity, speed, consistency, and confidence.

## Client Branding Rules

The admin UI must use the client’s brand identity, not generic template colors.

For Best Wheels Car Display:

- Use the Best Wheels logo in login and sidebar branding.
- Use red as the primary accent.
- Use charcoal/black for primary text and navigation.
- Use white surfaces and light gray backgrounds.
- Do not use orange/peach as the main UI accent unless specifically approved.

Logo usage:

- Full logo may be used on login and large branding areas.
- Sidebar logo must be constrained and never distorted.
- Use `object-contain`, not `object-cover`.
- Do not let the logo push navigation down too far.
- If the full logo is too wide, use a compact text version: `Best Wheels` with `Car Display` as small muted text.

Branding should support the UI, not overpower it.
