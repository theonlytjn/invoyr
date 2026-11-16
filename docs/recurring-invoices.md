# Recurring invoices

Business plan and up. Sidebar → **Recurring** (or **Recurring** on the Invoices page) →
`/invoices/recurring`.

## How a schedule works

- **First invoice on** is the date the first invoice is made, then every week, month,
  3 months or year from that date. Month ends are clamped (31 Jan → 28 Feb → 31 Mar), always
  counted from the start date so they don't drift. A start date in the past doesn't back-fill:
  the schedule picks up from its next date.
- The cron (`/api/cron/recurring`) runs daily at **06:00 UTC**. A schedule created for today
  after 06:00 makes its first invoice the next morning.
- Each invoice is dated the day it's made, with a due date from **Payment terms on each
  invoice** (`due_days`, default 30).
- **Auto-send** on: it's emailed to the client straight away through `sendInvoiceEmail`, same
  as pressing Send (pay link, CC list, logging, automations). Needs a client; a client with no
  email gets a draft instead. Auto-send off: a draft waits on the Invoices page.
- Paused schedules don't run. A schedule past its end date becomes **ended**; pushing the end
  date back on edit reactivates it.
- If the organisation loses the feature (trial lapsed, downgraded) its schedules are skipped
  and left in place, so they resume with the plan.
- Editing the frequency or start date moves the next invoice to match.

Logic: `src/lib/recurring/schedule.ts` (tested), validation `src/lib/recurring/schema.ts`.

## Fixed 16 Nov 2026

Before this, the first invoice came one period after the start date, generated invoices had
no due date, auto-sent emails linked the client to the owner's dashboard instead of the pay
page (and skipped CC), the cron ignored the plan, and the page wasn't in any menu.
