/**
 * The guide index, in one place so /help, the individual pages and any future
 * in-app links can't disagree about what exists.
 */
export interface HelpGuide {
  slug: string;
  title: string;
  summary: string;
  /** Grouping on the index page. */
  section: "Getting started" | "Getting paid" | "Running your business" | "Your account";
  /** Rough reading time, shown so people can judge before clicking. */
  minutes: number;
}

export const HELP_GUIDES: HelpGuide[] = [
  {
    slug: "getting-started",
    title: "Setting up your business",
    summary:
      "Create your account, add your business details and logo, and get your invoices looking like yours.",
    section: "Getting started",
    minutes: 4,
  },
  {
    slug: "sending-your-first-invoice",
    title: "Sending your first invoice",
    summary:
      "Add a client, build an invoice, preview it and send — including discounts and attachments.",
    section: "Getting started",
    minutes: 5,
  },
  {
    slug: "getting-paid",
    title: "Taking payments",
    summary:
      "Card payments through Stripe, PayPal, and bank transfer — how each works and what your client sees.",
    section: "Getting paid",
    minutes: 5,
  },
  {
    slug: "chasing-late-payments",
    title: "Chasing late payments",
    summary:
      "Automatic reminders before and after the due date, manual nudges, and late fees.",
    section: "Getting paid",
    minutes: 4,
  },
  {
    slug: "clients-and-contacts",
    title: "Clients and extra recipients",
    summary:
      "Keep client records, copy an accounts inbox on every invoice, and share a client portal.",
    section: "Running your business",
    minutes: 3,
  },
  {
    slug: "plans-and-billing",
    title: "Your trial, plan and billing",
    summary:
      "How the 14-day trial works, what each plan includes, and how to change or cancel.",
    section: "Your account",
    minutes: 3,
  },
];

export function getGuide(slug: string): HelpGuide | undefined {
  return HELP_GUIDES.find((g) => g.slug === slug);
}

export const HELP_SECTIONS = [
  "Getting started",
  "Getting paid",
  "Running your business",
  "Your account",
] as const;
