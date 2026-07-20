---
title: INV-006 Plans, Entitlements, Complimentary Access and Open Banking
version: 1.0
status: Implemented
owner: Product / Engineering
last_updated: 2026-07-17
---

# INV-006 — Plans, Entitlements, Complimentary Access and Open Banking

## 1. Goal

Define how paid tiers map to features, how features are gated, how free
(complimentary) accounts are granted without billing, and how Open Banking
(TrueLayer) fits the tier model.

## 2. Plans

Defined in `src/config/plans.ts`.

| Plan     | Price     | Users     |
| -------- | --------- | --------- |
| Starter  | £79/year  | 1         |
| Business | £149/year | Up to 5   |
| Pro      | £249/year | Unlimited |

## 3. Entitlements

- `Feature` is a string union of gated capabilities.
- `PLAN_FEATURES: Record<PlanId, Set<Feature>>` is the source of truth for what
  each plan can do.
- `canAccess(plan, feature)` is the single check used everywhere. It returns
  `false` for an unknown/`null` plan, so no plan means no gated features.
- `FEATURE_UPGRADE_TARGET` maps each feature to the lowest plan that unlocks it,
  for upsell copy.

Open Banking is gated by the `open_banking` feature, which lives in the **Pro**
set only.

## 4. Resolving an org's plan

`getOrgPlan(orgId)` in `src/lib/billing.ts` resolves the effective plan:

1. Read `organisations.comp_plan` / `comp_expires_at`. If `comp_plan` is set and
   not expired, return it. **Complimentary access wins over Stripe.**
2. Otherwise read `subscriptions`. Return `plan` only if the subscription status
   is active/trialing (`isSubscriptionActive`).
3. Otherwise return `null`.

`getCompPlan(org)` is the pure helper for step 1 and can be reused where the org
row is already loaded.

## 5. Complimentary (free) access

For the founder's own company and friends & family, an org can be granted a plan
for free, fully decoupled from Stripe so subscription webhooks can never revoke
it.

Columns on `organisations` (migration `add_org_complimentary_access`):

- `comp_plan` — `starter` | `business` | `pro` | `null`. Null = billed normally.
- `comp_reason` — `founder` | `friends_family` | `partner` | `beta` | `other`.
- `comp_expires_at` — timestamptz, or `null` for never expires.

### Granting

Admin area → Organisations → (org) → **Complimentary access** panel. Choose a
comp plan, reason, and optional expiry, then save. Setting the plan to *None*
removes the comp and returns the org to normal billing.

- API: `POST /api/admin/organisations/[id]/comp` (admin-only, Zod-validated).
- Every grant/revoke is written to `audit_logs` as `org.comp_granted` /
  `org.comp_revoked`.

The existing subscription override panel (`.../subscription`) still writes to the
`subscriptions` table and is for reflecting/patching real Stripe state — it is
**not** the free-access mechanism. Use the comp panel for free accounts.

## 6. Open Banking (TrueLayer) gating

Open Banking was previously ungated. It is now **Pro-only**, enforced at every
entry point:

- `GET /api/bank/connect` — redirects to `/settings/banking?upgrade=open_banking`
  if not entitled.
- `POST /api/bank/import` — 403 if not entitled.
- `POST /api/bank/[id]/sync` — 403 if not entitled.
- Settings → Banking (`/settings/banking`) — shows a Pro upsell instead of the
  connections panel when not entitled.
- Expenses → "Import from bank" button — hidden when not entitled
  (`canImportBank` prop on `ExpensesList`).

Gating banking also protects against per-connection TrueLayer costs on lower
tiers.

## 7. TrueLayer environment setup (required before use)

The integration is built but needs credentials from `console.truelayer.com`. Set
in `.env.local` (and Vercel) — see `.env.example`:

- `TRUELAYER_CLIENT_ID`
- `TRUELAYER_CLIENT_SECRET`
- `TRUELAYER_REDIRECT_URI` — must match the console registration exactly
  (e.g. `https://<host>/api/bank/callback`).
- `TRUELAYER_ENV` — `sandbox` or `live`.

Until these are set, `/api/bank/connect` cannot build a valid auth URL.
