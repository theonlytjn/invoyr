---
title: INV-009 Public roadmap and feedback
version: 1.0
status: Built, awaiting migration
owner: Product / Engineering
last_updated: 2026-11-15
---

# INV-009 — Public roadmap and feedback

## 1. Goal

Give customers a visible place to see what's coming, say how much each thing
matters to them, and suggest new ideas, modelled on Mimestream's Productboard
portal. It closes the loop on the signup follow-up email (INV-003), which asks
for feedback and links here.

## 2. Decisions (founder, 14 Nov 2026)

| Question | Decision |
| --- | --- |
| Who can see / vote | Public view at invoyr.io/roadmap; voting and suggesting need an Invoyr login |
| New ideas | Go to an admin inbox for review; never shown publicly as submitted |
| Reaction | Mimestream-style importance: Not important / Nice to have / Important / Critical, plus optional comment. Counts are admin-only |

## 3. Public page — `src/app/(marketing)/roadmap/page.tsx`

- Three tabs: **Planned** (sections *In progress*, then *Up next*), **Considering**
  (grouped by category, General last), **Launched** (grouped by month, newest first).
- Search across title, summary, body and category.
- Each card opens a dialog with the full description and the importance buttons.
  Choosing the current answer again clears the vote. Launched items can't be voted on.
- Deep links: `?tab=considering`, `?item=<slug>`, `?suggest=1`. Signed-out visitors
  are sent to `app.invoyr.io/login?next=/roadmap?item=<slug>` and come back to the
  same card (middleware moves `/roadmap` back to the marketing domain).
- Static (ISR, `revalidate = 300`) and refreshed immediately by `revalidatePath` on
  every admin edit. The visitor's own votes are fetched in the browser.
- Item bodies are plain text (blank line = paragraph, `- ` = bullet). Nothing users
  type is rendered as HTML.
- Copy lives in `src/config/roadmap.ts`.

## 4. Cross-origin calls

The page is on invoyr.io but the session cookie belongs to app.invoyr.io, the same
pattern as `/api/session`. `src/lib/api/cors.ts` opens CORS to the marketing origins
only, with credentials. Writes require `Content-Type: application/json`, which forces
a preflight that only the marketing origins pass, so another site can't post on a
signed-in visitor's behalf.

| Route | Auth | Purpose |
| --- | --- | --- |
| `GET /api/roadmap/votes` | session (optional) | The visitor's own votes |
| `POST /api/roadmap/votes` | session | Set, change or clear a vote (60/min per user) |
| `POST /api/roadmap/ideas` | session | Suggest an idea (10/hour per user) |
| `POST /api/admin/roadmap/items` | admin | Create item (optionally from an idea) |
| `PATCH/DELETE /api/admin/roadmap/items/[id]` | admin | Edit, publish, change stage, delete |
| `PATCH /api/admin/roadmap/ideas/[id]` | admin | Mark reviewed / declined, merge into an item |

All input is validated with Zod (`src/lib/roadmap/schema.ts`).

## 5. Data — `supabase/schema.sql` §24, migration `create_product_roadmap`

- `roadmap_items`: title, slug, summary, body, category, status
  (`considering | planned | in_progress | launched`), `is_published`, `sort_order`,
  `launched_at` (stamped automatically when moved to Launched).
- `roadmap_votes`: one per user per item, `importance` enum and optional comment.
- `roadmap_ideas`: submitted ideas with review status
  (`new | reviewed | merged | published | declined`) and the item they became.

These are product-level tables, not organisation data, so they are keyed by user
rather than `org_id`. RLS: anyone reads published items; users read and write only
their own votes (only on published items) and insert/read their own ideas. All admin
work uses the service role.

Starter content is in `supabase/seed-roadmap.sql`: shipped features as published
*Launched* items (dated from git history, claims checked against the code) and one
draft *Considering* item. Forward-looking items are drafts until the founder
publishes them.

## 6. Admin — `/admin/roadmap`

- **Items**: stage dropdown and publish toggle inline; votes as
  Critical · Important · Nice to have · Not important; a **demand score**
  (critical 3, important 2, nice to have 1) with sort by demand; a Feedback dialog
  listing every voter's email, answer and comment.
- **Ideas inbox**: add to roadmap (prefills a new item and links the idea), merge into
  an existing item, mark reviewed, decline, reopen.

## 7. Not done / follow-ups

- No email to voters when an item they voted on launches (the data supports it).
- No admin notification when an idea arrives; check the inbox.
- Ideas from people who never finished onboarding are accepted, but the signup
  follow-up email only reaches account owners (email_logs needs an org).
