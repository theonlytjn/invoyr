export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

/** "every week", "every month"… for the schedule summary. */
export const FREQUENCY_PHRASES: Record<RecurringFrequency, string> = {
  weekly: "every week",
  monthly: "every month",
  quarterly: "every 3 months",
  yearly: "every year",
};

/** Payment terms a schedule can put on each invoice, in days after it's issued. */
export const RECURRING_DUE_DAYS = [
  { days: 0, label: "Due immediately" },
  { days: 7, label: "Net 7 days" },
  { days: 14, label: "Net 14 days" },
  { days: 30, label: "Net 30 days" },
] as const;

const MONTHS: Record<RecurringFrequency, number> = { weekly: 0, monthly: 1, quarterly: 3, yearly: 12 };

function parse(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * The start date moved on by `n` periods. Months are clamped rather than
 * overflowed, and always counted from the start date, so a schedule starting
 * on 31 Jan runs 28 Feb, 31 Mar, 30 Apr… instead of drifting to the 3rd.
 */
export function addPeriods(startDate: string, frequency: RecurringFrequency, n: number): string {
  const start = parse(startDate);
  if (frequency === "weekly") {
    start.setUTCDate(start.getUTCDate() + 7 * n);
    return iso(start);
  }
  const day = start.getUTCDate();
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + MONTHS[frequency] * n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return iso(target);
}

/** The first run date in the schedule that falls after `after`. */
export function nextRunAfter(startDate: string, frequency: RecurringFrequency, after: string): string {
  if (startDate > after) return startDate;
  // Jump close to the answer, then step: avoids looping year by year on old schedules.
  const days = (parse(after).getTime() - parse(startDate).getTime()) / 86_400_000;
  let n = Math.max(1, Math.floor(frequency === "weekly" ? days / 7 : days / (30.44 * MONTHS[frequency])) - 1);
  while (addPeriods(startDate, frequency, n) <= after) n++;
  return addPeriods(startDate, frequency, n);
}

/**
 * The first run on or after `today`. A start date in the past doesn't
 * back-fill missed invoices; the schedule picks up from its next date.
 */
export function firstRunOnOrAfter(startDate: string, frequency: RecurringFrequency, today: string): string {
  if (startDate >= today) return startDate;
  const yesterday = parse(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return nextRunAfter(startDate, frequency, iso(yesterday));
}

/** The due date for an invoice issued on `issueDate` with these terms. */
export function dueDateFor(issueDate: string, dueDays: number): string {
  const d = parse(issueDate);
  d.setUTCDate(d.getUTCDate() + dueDays);
  return iso(d);
}
