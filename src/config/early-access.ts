/**
 * The early-adopter programme shown on /early-access. The code itself, its
 * trial length, its offer and how many people can use it live in the
 * `trial_codes` table (Supabase); keep these in step with that row when
 * changing the offer.
 */
export const EARLY_ACCESS = {
  code: "FOUNDING",
  trialDays: 30,
  spots: 50,
  /** Off the first yearly payment, if they choose to take it. */
  yearlyOfferPercent: 25,
} as const;

/** The yearly offer shows in Billing from this many days before the trial ends… */
export const OFFER_OPENS_DAYS_BEFORE_TRIAL_END = 7;
/** …and can still be claimed for this many days after it. */
export const OFFER_CLOSES_DAYS_AFTER_TRIAL_END = 14;
