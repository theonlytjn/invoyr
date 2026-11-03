import {
  OFFER_CLOSES_DAYS_AFTER_TRIAL_END,
  OFFER_OPENS_DAYS_BEFORE_TRIAL_END,
} from "@/config/early-access";

const DAY = 86_400_000;

/**
 * When an early adopter's yearly offer can be claimed: from a week before the
 * trial ends until two weeks after. No server imports, so it can be tested and
 * used anywhere.
 */
export function offerWindow(trialEndsAt: string | Date) {
  const end = new Date(trialEndsAt).getTime();
  return {
    opensAt: new Date(end - OFFER_OPENS_DAYS_BEFORE_TRIAL_END * DAY),
    closesAt: new Date(end + OFFER_CLOSES_DAYS_AFTER_TRIAL_END * DAY),
  };
}

export function isOfferOpen(trialEndsAt: string | Date, now: Date = new Date()): boolean {
  const { opensAt, closesAt } = offerWindow(trialEndsAt);
  return now >= opensAt && now <= closesAt;
}

/** The yearly price after the discount, to the penny. */
export function discountedYearly(yearly: number, percent: number): number {
  return Math.round(yearly * (100 - percent)) / 100;
}
