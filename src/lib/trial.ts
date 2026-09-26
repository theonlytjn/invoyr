/**
 * Entitlement helpers with no imports, so the edge middleware can use them
 * without pulling in the Supabase server client (and `next/headers`) that the
 * rest of `lib/billing` needs.
 */

/**
 * Whether a subscription still entitles the org to its plan.
 *
 * `trial_ends_at` is checked because a trial can outlive whatever created it:
 * nothing external moves a row off `trialing` unless Stripe does, so a trial
 * without the date check would grant its plan forever.
 */
export function isSubscriptionActive(
  status: string | null | undefined,
  trialEndsAt?: string | null
): boolean {
  if (status === "active") return true;
  if (status !== "trialing") return false;
  if (!trialEndsAt) return true;
  return new Date(trialEndsAt) > new Date();
}

/** Days left in a running trial, or null when there isn't one. */
export function trialDaysRemaining(
  status: string | null | undefined,
  trialEndsAt?: string | null
): number | null {
  if (status !== "trialing" || !trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Comp grants win over Stripe; an expired grant does not count. */
export function hasActiveComp(org: {
  comp_plan?: string | null;
  comp_expires_at?: string | null;
} | null | undefined): boolean {
  if (!org?.comp_plan) return false;
  if (org.comp_expires_at && new Date(org.comp_expires_at) <= new Date()) return false;
  return true;
}
