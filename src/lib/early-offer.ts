import { createServiceClient } from "./supabase/server";
import { isOfferOpen, offerWindow } from "./early-offer-window";

export type EarlyOffer = {
  code: string;
  percent: number;
  opensAt: string;
  closesAt: string;
  claimedAt: string | null;
  /** Inside the window and not yet claimed. */
  claimable: boolean;
};

/**
 * The follow-up offer an org earned by signing up with an early-access code,
 * or null when it has none. Timed from the trial end Stripe reported.
 */
export async function getEarlyOffer(orgId: string): Promise<EarlyOffer | null> {
  const supabase = await createServiceClient();

  const [{ data: redemption }, { data: sub }] = await Promise.all([
    supabase
      .from("trial_code_redemptions")
      .select("code, offer_claimed_at, trial_codes(yearly_offer_percent)")
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase.from("subscriptions").select("trial_ends_at").eq("org_id", orgId).maybeSingle(),
  ]);

  const codeRow = Array.isArray(redemption?.trial_codes) ? redemption?.trial_codes[0] : redemption?.trial_codes;
  const percent = (codeRow as { yearly_offer_percent?: number | null } | null)?.yearly_offer_percent;
  if (!redemption || !percent || !sub?.trial_ends_at) return null;

  const { opensAt, closesAt } = offerWindow(sub.trial_ends_at);
  return {
    code: redemption.code,
    percent,
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
    claimedAt: redemption.offer_claimed_at,
    claimable: !redemption.offer_claimed_at && isOfferOpen(sub.trial_ends_at),
  };
}
