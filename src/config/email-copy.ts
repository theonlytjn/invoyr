import { TRIAL_DAYS } from "./plans";

/**
 * Copy for the trial lifecycle emails, kept out of the rendering components so
 * wording can change without touching layout (CLAUDE.md). The reminders are
 * transactional billing notices, not marketing: they tell someone what is about
 * to happen to a paid account, so they send regardless of marketing consent.
 */
export const TRIAL_EMAIL_COPY = {
  /** Which days-remaining values get an email. One at three days, one the day before. */
  reminderDays: [3, 1] as const,

  subject(daysLeft: number): string {
    if (daysLeft <= 1) return "Your Invoyr trial ends tomorrow";
    return `Your Invoyr trial ends in ${daysLeft} days`;
  },

  heading(daysLeft: number): string {
    if (daysLeft <= 1) return "Your trial ends tomorrow";
    return `Your trial ends in ${daysLeft} days`;
  },

  preview: "Keep your workspace active.",

  body(daysLeft: number, endsOn: string, willBeCharged: boolean): string {
    const when = daysLeft <= 1 ? "tomorrow" : `in ${daysLeft} days`;
    return willBeCharged
      ? `Your ${TRIAL_DAYS}-day trial ends ${when}, on ${endsOn}, and your card will be charged for the plan you chose. Nothing is needed from you — cancel before then if you'd rather not continue.`
      : `Your ${TRIAL_DAYS}-day trial ends ${when}, on ${endsOn}. Choose a plan before then to keep creating invoices, managing clients and collecting payments without interruption.`;
  },

  cta(willBeCharged: boolean): string {
    return willBeCharged ? "View billing" : "Choose my plan";
  },
} as const;
