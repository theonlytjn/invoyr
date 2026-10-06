import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import GuideDoc from "@/components/marketing/GuideDoc";
import { HELP_GUIDES, getGuide } from "@/config/help-guides";
import { TRIAL_DAYS } from "@/config/plans";

export function generateStaticParams() {
  return HELP_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  return {
    title: `${guide.title} — Invoyr help`,
    description: guide.summary,
  };
}

/**
 * Guide bodies live here rather than in MDX: there are few enough that a map
 * keeps them typechecked and searchable, with no extra build step.
 */
const BODIES: Record<string, React.ReactNode> = {
  "getting-started": (
    <>
      <p>
        Everything on your invoices — your name, address, logo and colour — comes from your
        business settings. Five minutes here makes every invoice you ever send look right.
      </p>

      <h2>1. Create your account</h2>
      <p>
        Sign up with an email address and password, or continue with Google. You&apos;ll confirm
        your email, then set up your business: name, address, VAT number if you have one, and the
        email address your clients should reply to.
      </p>

      <h2>2. Add your logo and colour</h2>
      <p>
        Upload a logo (PNG, JPG, WEBP or SVG, up to 2MB) and pick an accent colour. Both appear on
        your invoices, on the page your clients pay from, and in the emails sent on your behalf.
        You can change them later in <strong>Settings → Company</strong>.
      </p>
      <p>
        If you choose a very light colour, text that sits on it switches to dark automatically, so
        nothing disappears.
      </p>

      <h2>3. Choose a plan</h2>
      <p>
        Pick the plan that fits and add a card to start your {TRIAL_DAYS}-day trial. Nothing is
        charged until the trial ends, and you can cancel before then. See{" "}
        <Link href="/help/plans-and-billing">your trial, plan and billing</Link> for what happens
        next.
      </p>

      <h2>4. Set your invoice defaults</h2>
      <p>
        In <strong>Settings → Invoices</strong> you can set your invoice number prefix, default
        payment terms, and the notes and terms that appear at the bottom of every invoice. Setting
        these once saves retyping them on every invoice.
      </p>

      <h2>What next</h2>
      <p>
        You&apos;re ready to{" "}
        <Link href="/help/sending-your-first-invoice">send your first invoice</Link>.
      </p>
    </>
  ),

  "sending-your-first-invoice": (
    <>
      <p>
        An invoice needs a client, some line items and a due date. Everything else — numbering,
        totals, the payment link — Invoyr handles.
      </p>

      <h2>1. Add a client</h2>
      <p>
        You can add clients from the Clients page, or create one without leaving the invoice: on a
        new invoice, click <strong>+ New client</strong> next to the client field. You need a
        contact name and an email address; company name is optional. Everything else can be filled
        in later.
      </p>

      <h2>2. Build the invoice</h2>
      <ul>
        <li>
          <strong>Line items</strong> — a description, quantity, unit price and VAT rate for each.
          Totals update as you type.
        </li>
        <li>
          <strong>Payment terms</strong> — choose 7, 14 or 30 days and the due date is set for you,
          or pick a custom date.
        </li>
        <li>
          <strong>Discount</strong> — enter an amount and, optionally, a reason. The reason is shown
          to your client beside the discount, so a reduced total never looks like a mistake.
        </li>
        <li>
          <strong>PO number, notes and terms</strong> — optional, and the last two can default from
          your settings.
        </li>
      </ul>
      <p>
        A live preview shows exactly what your client will receive, in whichever of the four
        templates you&apos;ve chosen.
      </p>

      <h2>3. Attach files if you need to</h2>
      <p>
        Once an invoice is saved you can attach files to it — a signed quote, a timesheet, a
        receipt. Your client can download them from the invoice.
      </p>

      <h2>4. Send it</h2>
      <p>
        Save the invoice, then choose <strong>Send to client</strong>. Invoyr emails it in your
        name, from your business, with a link to view and pay. You&apos;ll get a confirmation
        naming everyone it went to, including anyone copied in.
      </p>
      <p>
        The invoice&apos;s history then records what happened and when: sent, opened by your client,
        reminders, and payment.
      </p>

      <h2>Drafts vs issued</h2>
      <p>
        <strong>Save as draft</strong> keeps an invoice editable and unsent. <strong>Save
        &amp; issue</strong> finalises it ready to send. Draft invoices don&apos;t count towards
        anything and can be deleted; issued ones can be voided but not deleted, so your numbering
        stays intact.
      </p>
    </>
  ),

  "getting-paid": (
    <>
      <p>
        Every invoice you send includes a link to a payment page branded as your business. What
        appears on that page depends on which methods you&apos;ve set up.
      </p>

      <h2>Card payments (Stripe)</h2>
      <p>
        Connect your Stripe account in <strong>Settings → Payments</strong>. Your clients then pay
        by card, and the money goes <strong>directly to your Stripe account</strong> — Invoyr never
        holds it and takes no cut of your invoices. Stripe&apos;s own fees apply.
      </p>
      <p>
        When a payment succeeds the invoice is marked paid automatically, a payment is recorded, and
        both you and your client get an email.
      </p>

      <h2>PayPal</h2>
      <p>
        Available on Business and Pro. Add your PayPal email in{" "}
        <strong>Settings → Payments</strong> and a PayPal button appears alongside card payment.
        Clients can also pay by debit or credit card through PayPal without a PayPal account.
      </p>

      <h2>Bank transfer</h2>
      <p>
        Add your account name, sort code and account number (or IBAN and BIC) and they&apos;ll be
        shown on both the invoice and the payment page, with the invoice number as the reference.
      </p>
      <p>
        Bank transfers arrive outside Invoyr, so mark those invoices paid yourself using{" "}
        <strong>Record payment</strong> on the invoice. You can record a partial payment, and the
        balance stays outstanding.
      </p>

      <h2>What your client sees</h2>
      <p>
        A single page with your logo and colour, the invoice details, the amount due, and whichever
        payment buttons apply. No account, no login, nothing to install.
      </p>
    </>
  ),

  "chasing-late-payments": (
    <>
      <p>
        Chasing payment is the worst part of freelancing. Invoyr does it for you, politely, in your
        name.
      </p>

      <h2>Reminders before the due date</h2>
      <p>
        In <strong>Settings → Email</strong> you can have Invoyr email your client 1, 3 or 7 days
        before an invoice falls due. Each reminder is sent once per invoice. Leave them all
        unselected to switch pre-due reminders off.
      </p>

      <h2>Reminders after the due date</h2>
      <p>
        The overdue schedule sends at 3, 7, 14, 21 and 30 days past the due date — pick whichever
        intervals suit. Each goes once, and stops as soon as the invoice is paid.
      </p>

      <h2>Sending a reminder yourself</h2>
      <p>
        On any unpaid invoice, choose <strong>Send reminder</strong> for an immediate nudge. It goes
        to the client and anyone copied on that client&apos;s invoices, and is recorded in the
        invoice&apos;s history.
      </p>

      <h2>Late fees</h2>
      <p>
        You can set a late fee — a fixed amount or a percentage — with a grace period, so it only
        applies once an invoice is genuinely overdue. The fee is added to the amount due and shown
        separately, so your client can see exactly what it is.
      </p>

      <h2>Knowing where you stand</h2>
      <p>
        The dashboard shows what&apos;s outstanding, what&apos;s overdue and what&apos;s been paid.
        Each invoice&apos;s history tells you when it was sent, when your client opened the email,
        and when they opened the invoice itself — useful context before you pick up the phone.
      </p>
    </>
  ),

  "clients-and-contacts": (
    <>
      <p>
        A client record holds everything that appears on their invoices, plus who should receive
        them.
      </p>

      <h2>What a client needs</h2>
      <p>
        A contact name and email are enough to invoice someone. Add a company name, billing address
        and VAT number and they&apos;ll appear on every invoice for that client.
      </p>

      <h2>Copying other people in</h2>
      <p>
        Larger clients often want invoices sent to more than one person — an accounts inbox, a
        project manager. On the client, use <strong>Also send invoices to</strong> and add up to
        five addresses, separated by commas.
      </p>
      <p>
        Those addresses are copied on every invoice, reminder and statement for that client. If one
        is mistyped, the invoice still goes to your main contact — a bad address never blocks the
        send.
      </p>

      <h2>Statements</h2>
      <p>
        You can email a client a statement of account: everything outstanding, in one PDF. Useful at
        month end, or when someone asks what they owe in total.
      </p>

      <h2>Archiving and deleting</h2>
      <p>
        Archiving hides a client you no longer work with while keeping their history. Deleting
        removes them — and because invoices must stay accurate, Invoyr keeps a copy of their details
        on invoices already issued, so old invoices and payment pages still show who they were for.
      </p>
    </>
  ),

  "plans-and-billing": (
    <>
      <p>
        Every plan starts with a {TRIAL_DAYS}-day free trial. There&apos;s no free tier — Invoyr is
        a paid tool, and the trial is there so you can judge it properly.
      </p>

      <h2>How the trial works</h2>
      <p>
        You choose a plan and add a card when you sign up. Nothing is charged for {TRIAL_DAYS} days.
        We email you three days before the trial ends and again the day before, so the first charge
        is never a surprise. Cancel any time before it ends and you won&apos;t be charged.
      </p>
      <p>
        Your remaining days are shown in the app, next to your plan.
      </p>

      <h2>If you don&apos;t continue</h2>
      <p>
        When a trial ends without a subscription, your account pauses: you&apos;ll be taken to the
        billing page until you choose a plan. <strong>Nothing is deleted.</strong> Your invoices,
        clients and payment history stay exactly as they were, and you can still download a full
        export of your data from <strong>Settings → Account</strong>.
      </p>

      <h2>Changing plan</h2>
      <p>
        Upgrade or downgrade at any time from <strong>Settings → Billing</strong>. Plans are billed
        annually, and a change takes effect from your next renewal — you&apos;re never charged twice
        for the same period.
      </p>

      <h2>What&apos;s in each plan</h2>
      <p>
        Full details are on the <Link href="/pricing">pricing page</Link>. In short: unlimited
        invoicing and card payments on every plan; PayPal, bulk actions, statements and removing
        Invoyr branding from Business upwards; Open Banking, API access and the heavier automation
        on Pro.
      </p>
    </>
  ),
};

export default async function HelpGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  const body = BODIES[slug];

  if (!guide || !body) notFound();

  return (
    <GuideDoc title={guide.title} summary={guide.summary} minutes={guide.minutes}>
      {body}
    </GuideDoc>
  );
}
