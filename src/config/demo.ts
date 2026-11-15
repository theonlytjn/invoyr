/** Copy and settings for the "Book a demo" page (invoyr.io/demo). */
export const DEMO_COPY = {
  kicker: "Book a demo",
  title: "See Invoyr in 20 minutes",
  intro:
    "A short, friendly walkthrough on a video call, with the founder. Bring your questions, or we can set up your account together as we go.",
  agendaHeading: "What we'll cover",
  agenda: [
    "Adding your logo and brand colour so every invoice looks like yours",
    "Adding a client and creating your first invoice",
    "Sending it, and what your client sees when it arrives",
    "Getting paid by card, bank transfer or PayPal, and how reminders chase for you",
    "Anything specific to how you work: recurring billing, estimates, teams",
  ],
  formHeading: "Request a time",
  /** Shown instead of the form's intro when a booking link is configured. */
  bookingCta: "Pick a time in my calendar",
  bookingAlt: "Or tell us a bit about you and we'll email you some times.",
  success: {
    title: "Request received",
    body: "We'll email you within one business day with a few times to choose from.",
  },
  teamSizes: ["Just me", "2–5 people", "6–20 people", "More than 20"],
  /**
   * A Cal.com / Calendly link. When set, the page offers it as the main action
   * and keeps the form as a fallback.
   */
  bookingUrl: process.env.NEXT_PUBLIC_DEMO_BOOKING_URL || null,
} as const;
