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

/**
 * The founder's note that goes out three days after signup, thanking people for
 * trying Invoyr and asking for feedback. A one-off relationship email with no
 * offer or promotion in it, so it is sent as transactional mail. Replies go to
 * support, and the CTA opens the public roadmap where ideas and votes are
 * collected.
 */
/**
 * Personal notes from the founder, signed, sent from "Tony from Invoyr" with
 * replies going to support. No offers or promotion, so they go out as
 * relationship (transactional) email.
 */
export const FOUNDER_NOTE_COPY = {
  /** Hours after the trigger (signup, or trial end) before a note is due; each daily run covers the next 24h. */
  delayHours: 72,
  signup: {
    subject: "Thanks for trying Invoyr",
    preview: "A quick note from the founder, and a favour to ask.",
    heading: (firstName?: string | null) =>
      firstName ? `Thanks for giving Invoyr a go, ${firstName}` : "Thanks for giving Invoyr a go",
    paragraphs: [
      "It's been a few days since you signed up, so I wanted to say thank you personally. Invoyr is still young, and every person who tries it genuinely shapes what it becomes.",
      "I'd really value your honest take. What's working, what's confusing, and what's missing? Big or small, I read every reply myself.",
      "You can also see what we're building next on our public roadmap. Vote on the ideas that matter to you, or suggest your own.",
    ],
    cta: "See the roadmap",
  },
  trialEnded: {
    subject: "Sorry to see you go",
    preview: "One quick question from the founder: what got in the way?",
    heading: (firstName?: string | null) =>
      firstName ? `Sorry to see you go, ${firstName}` : "Sorry to see you go",
    paragraphs: [
      "Your Invoyr trial ended a few days ago and you didn't carry on, so I wanted to say thank you for giving it a proper try.",
      "I'd love to know what stopped you. Was something missing, confusing or harder than it should have been? Or was it simply the wrong time? Even one line helps, and I read every reply myself.",
      "If there's something that would have made the difference, suggest it on our public roadmap. That's where we decide what to build next, and it's how we hope to earn you back.",
      "Everything you set up is still there if you ever want to pick up where you left off.",
    ],
    cta: "Suggest an improvement",
  },
  replyPrompt: "Or just hit reply. It comes straight to me.",
  signOff: "Thanks,",
  signerName: "Tony Nwachi",
  signerTitle: "Founder, Invoyr",
} as const;

export type FounderNoteKind = "signup" | "trialEnded";

/** Row labels for the InvoiceSummary block, by what it's summarising. */
export const SUMMARY_LABELS = {
  invoice: { date: "Issue date", due: "Due date", number: "Invoice", total: "Total" },
  estimate: { date: "Issue date", due: "Valid until", number: "Estimate", total: "Total" },
  payment: { date: "Paid on", due: "Due date", number: "Invoice", total: "Amount paid" },
} as const;

export type SummaryKind = keyof typeof SUMMARY_LABELS;

/** Sent from the Stripe webhook when a subscription becomes active. */
export const SUBSCRIPTION_ACTIVATED_COPY = {
  preview: (planName: string) => `You're now on the ${planName} plan. Let's get started.`,
  heading: (planName: string) => `You're on ${planName}`,
  intro: (planName: string) => `Your ${planName} subscription is now active. Here's what you've unlocked:`,
  outro: "Head to your dashboard to make the most of your workspace.",
  cta: "Go to my dashboard",
} as const;

/** Lapsed-account sequence (marketing; consent and unsubscribe required). Not yet wired to a sender. */
export const WIN_BACK_COPY = {
  day0: {
    preview: "We saved your Invoyr workspace.",
    heading: "We saved your workspace",
    body: "Your Invoyr workspace is still here. All your clients, invoices and payment history are ready and waiting whenever you come back.",
    cta: "Return to Invoyr",
  },
  day3: {
    preview: "Here's what you can still do with Invoyr.",
    heading: "What you can still do with Invoyr",
    body: "Create and send professional invoices, accept card payments, track what's outstanding and get paid faster, all in one place. Your workspace is saved.",
    cta: "Pick up where you left off",
  },
  day7: {
    // No promotional offer here: there is no free-month mechanism in billing,
    // so the email mustn't promise one.
    preview: "Pay monthly now, from £8 a month.",
    heading: "Come back on a monthly plan",
    body: "Every Invoyr plan can now be paid monthly, from £8 a month, so there's no big upfront commitment. Your data is still safe and your clients are still there.",
    cta: "Choose a plan",
  },
} as const;

/** Product update announcement (marketing; consent and unsubscribe required). */
export const PRODUCT_UPDATE_COPY = {
  kicker: "Product update",
  preview: (title: string) => `What's new in Invoyr: ${title}`,
  featuresHeading: "What's new:",
  cta: "Open Invoyr",
} as const;

/** The invoice email to a client (InvoiceSentEmail) and the owner's compose box. */
export const INVOICE_SENT_COPY = {
  subject: (invoiceNumber: string, orgName?: string | null) =>
    `Invoice ${invoiceNumber}${orgName ? ` from ${orgName}` : ""}`,
  preview: (orgName: string, total: string) => `${orgName} has sent you an invoice for ${total}.`,
  heading: (invoiceNumber: string) => `Invoice ${invoiceNumber}`,
  greeting: (clientName: string) => `Hi ${clientName},`,
  intro: (orgName: string, invoiceNumber: string, total: string) =>
    `${orgName} has sent you invoice ${invoiceNumber} for ${total}.`,
  /** Label above the sender's own note, when they wrote one. */
  messageLabel: (orgName: string) => `A note from ${orgName}`,
  howToPay: "You can view the invoice, download a PDF and pay securely using the link below.",
  cta: "View and pay invoice",
  bankHeading: "Or pay by bank transfer",
  bankReference: "Reference:",
  /** Longest personal message the compose box accepts. */
  messageMaxLength: 2000,
  subjectMaxLength: 200,
} as const;
