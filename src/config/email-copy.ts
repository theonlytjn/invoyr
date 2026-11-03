export type TrialEmailState = "ending" | "ended";

export interface TrialEmailContext {
  state: TrialEmailState;
  /** Whole days until the trial ends; 1 means "tomorrow". Ignored once ended. */
  daysLeft?: number;
  /** Formatted end date, e.g. "3 October". */
  endsOn: string;
  /** True when a card is on file and Stripe charges it automatically. */
  willBeCharged: boolean;
  /** An early adopter's unclaimed yearly discount, when there is one. */
  yearlyOffer?: { percent: number; claimBy: string };
}

/**
 * Copy for the trial lifecycle emails, kept out of the rendering components so
 * wording can change without touching layout (CLAUDE.md). These are
 * transactional billing notices, not marketing: they tell someone what is about
 * to happen — or has happened — to a paid account, so they send regardless of
 * marketing consent.
 */
export const TRIAL_EMAIL_COPY = {
  /** Which days-remaining values get a reminder. Three days out, and the day before. */
  reminderDays: [3, 1] as const,

  subject({ state, daysLeft }: TrialEmailContext): string {
    if (state === "ended") return "Your Invoyr trial has ended";
    if ((daysLeft ?? 0) <= 1) return "Your Invoyr trial ends tomorrow";
    return `Your Invoyr trial ends in ${daysLeft} days`;
  },

  heading({ state, daysLeft }: TrialEmailContext): string {
    if (state === "ended") return "Your trial has ended";
    if ((daysLeft ?? 0) <= 1) return "Your trial ends tomorrow";
    return `Your trial ends in ${daysLeft} days`;
  },

  preview({ state }: TrialEmailContext): string {
    return state === "ended"
      ? "Choose a plan to get back into your account."
      : "Keep your workspace active.";
  },

  body({ state, daysLeft, endsOn, willBeCharged }: TrialEmailContext): string {
    // No trial length here: early-access codes give longer trials than the standard one.
    if (state === "ended") {
      return `Your free trial ended on ${endsOn}, so your account is paused until you choose a plan. Nothing has been deleted — your invoices, clients and payment history are exactly as you left them, and you can still download your data from Account settings at any time.`;
    }
    const when = (daysLeft ?? 0) <= 1 ? "tomorrow" : `in ${daysLeft} days`;
    return willBeCharged
      ? `Your free trial ends ${when}, on ${endsOn}, and your card will be charged for the plan you chose. Nothing is needed from you — cancel before then if you'd rather not continue.`
      : `Your free trial ends ${when}, on ${endsOn}. Choose a plan before then to keep creating invoices, managing clients and collecting payments without interruption.`;
  },

  /** A second paragraph for early adopters who haven't claimed their discount. */
  offer({ yearlyOffer }: TrialEmailContext): string | null {
    if (!yearlyOffer) return null;
    return `As an early adopter, you can also take ${yearlyOffer.percent}% off your first year by switching to yearly billing. It's in Billing, and open until ${yearlyOffer.claimBy}.`;
  },

  cta({ state, willBeCharged, yearlyOffer }: TrialEmailContext): string {
    if (yearlyOffer) return `Claim ${yearlyOffer.percent}% off yearly`;
    if (state === "ended") return "Choose a plan";
    return willBeCharged ? "View billing" : "Choose my plan";
  },
} as const;
