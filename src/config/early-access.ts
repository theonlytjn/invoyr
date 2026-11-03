/**
 * The early-adopter offer shown on /early-access. The code itself, its length
 * and how many people can use it live in the `trial_codes` table (Supabase);
 * keep these in step with that row when changing the offer.
 */
export const EARLY_ACCESS = {
  code: "FOUNDING",
  trialDays: 90,
  spots: 50,
} as const;
