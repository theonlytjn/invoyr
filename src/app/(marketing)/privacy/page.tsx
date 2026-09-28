import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc from "@/components/marketing/LegalDoc";
import { LEGAL_ENTITY, SUB_PROCESSORS } from "@/config/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Invoyr",
  description: "How Invoyr collects, uses and protects personal data.",
};

// Rewritten 28 Sep 2026 to match the Terms & Conditions: the controller /
// processor split, trial auto-conversion, the 7-day deletion window, and the
// sub-processor list from @/config/legal (verified against the live system).
//
// DRAFT FOR LEGAL REVIEW — not reviewed by counsel.
export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" lastUpdated="28 September 2026">
      <p>
        This Privacy Policy explains how <strong>{LEGAL_ENTITY.name}</strong>, trading as{" "}
        {LEGAL_ENTITY.tradingAs}, of {LEGAL_ENTITY.address}
        {LEGAL_ENTITY.companyNumber ? `, company number ${LEGAL_ENTITY.companyNumber}` : ""}{" "}
        (&ldquo;Invoyr&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) handles personal data in
        connection with the Invoyr website, web application and related services (the
        &ldquo;Service&rdquo;).
      </p>
      <p>
        Invoyr is a business-to-business service. It should be read together with our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link> and, where Invoyr processes personal data
        on a Customer&rsquo;s behalf, our <Link href="/dpa">Data Processing Addendum</Link>.
      </p>

      <h2>1. The two roles Invoyr plays</h2>
      <p>This is the most important thing to understand about how we handle data.</p>
      <p>
        <strong>We are a controller</strong> for the information we decide how to use: your account
        details, your subscription and billing records, your use of the Service, support
        correspondence and marketing preferences. This policy governs that data.
      </p>
      <p>
        <strong>We are a processor</strong> for the data you put into the Service about your own
        clients — their names, contact details, invoices, payments and related records
        (&ldquo;Customer Data&rdquo;). You decide why and how that data is used; we act on your
        instructions. Our <Link href="/dpa">Data Processing Addendum</Link> governs that
        processing, and your own privacy notice — not this one — is what your clients should be
        given.
      </p>

      <h2>2. Personal data we collect as a controller</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your name, email address and a securely hashed password, or
          the basic profile returned by Google if you sign in that way.
        </li>
        <li>
          <strong>Business data:</strong> your business name, address, VAT number, logo, bank details
          shown on your invoices, and the contact details you publish to your clients.
        </li>
        <li>
          <strong>Subscription and billing data:</strong> your plan, trial and renewal dates, and
          payment records. Card details are handled by Stripe — we never receive or store complete
          card numbers.
        </li>
        <li>
          <strong>Usage and technical data:</strong> log data, IP address, device and browser
          information, and records of actions taken in your account (our audit log).
        </li>
        <li>
          <strong>Email delivery data:</strong> records of the transactional emails we send on your
          behalf, including whether they were delivered and opened.
        </li>
        <li>
          <strong>Communications:</strong> messages you send us through the contact form or support
          email, and your marketing preferences.
        </li>
      </ul>

      <h2>3. Why we use it, and our lawful basis</h2>
      <ul>
        <li>
          <strong>To provide the Service</strong> — creating your account, hosting your data, sending
          invoices you ask us to send, processing payments.{" "}
          <em>Lawful basis: performance of a contract.</em>
        </li>
        <li>
          <strong>To take payment and manage subscriptions</strong>, including starting trials,
          converting them and handling failed payments.{" "}
          <em>Lawful basis: performance of a contract.</em>
        </li>
        <li>
          <strong>To keep the Service secure</strong> — authentication, rate limiting, anti-bot
          checks, fraud prevention and audit logging.{" "}
          <em>Lawful basis: legitimate interests in protecting the Service and its users.</em>
        </li>
        <li>
          <strong>To support and improve the Service</strong>, and to respond to your questions.{" "}
          <em>Lawful basis: legitimate interests in running and improving our business.</em>
        </li>
        <li>
          <strong>To send service messages</strong> you need to receive, such as trial reminders,
          billing notices and security alerts. These are not marketing and cannot be opted out of
          while you hold an account. <em>Lawful basis: performance of a contract.</em>
        </li>
        <li>
          <strong>To send marketing email</strong> about Invoyr. <em>Lawful basis: consent</em>,
          given by opting in — you can withdraw it at any time using the unsubscribe link or in your
          settings.
        </li>
        <li>
          <strong>To meet legal obligations</strong>, including tax, accounting and responding to
          lawful requests. <em>Lawful basis: legal obligation.</em>
        </li>
      </ul>

      <h2>4. Customer Data: what we do and do not do with it</h2>
      <p>
        We host and process Customer Data to provide the Service to you, to keep it secure, to back
        it up, and to support you when you ask.
      </p>
      <p>
        We do not sell Customer Data, we do not use it to advertise to you or to anyone else, and we
        do not use it to train machine-learning models.
      </p>
      <p>
        Where you enable automated invoice reminders, you are instructing us to email your clients on
        your behalf. You remain responsible for having a lawful basis to contact them, as set out in
        the Terms.
      </p>

      <h2>5. Sub-processors and sharing</h2>
      <p>
        We use a small number of providers to run the Service. Each is bound by contract to protect
        the data it handles and to use it only for the purpose below.
      </p>
      <ul>
        {SUB_PROCESSORS.map((provider) => (
          <li key={provider.name}>
            <strong>{provider.name}</strong> — {provider.purpose}. Processed in: {provider.location}.
          </li>
        ))}
      </ul>
      <p>
        We may also share personal data with professional advisers, or where required by law, a
        regulator or a court. If Invoyr is involved in a merger, acquisition or sale of assets, data
        may transfer to the acquiring party, and we will notify you before that happens.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Customer Data is stored at rest in the European Union (Frankfurt). Some of our providers,
        including our hosting and email providers, process data in the United States or across a
        global network, which means personal data may be processed outside the UK and EEA.
      </p>
      <p>
        Where that happens, we rely on appropriate safeguards — such as the UK International Data
        Transfer Agreement or Addendum, and the European Commission&rsquo;s Standard Contractual
        Clauses — together with the provider&rsquo;s own technical protections.
      </p>

      <h2>7. How long we keep it</h2>
      <ul>
        <li>
          <strong>Customer Data:</strong> for as long as your account is active. Following
          termination or account deletion, it is ordinarily scheduled for deletion from active
          systems within 7 days, as set out in the Terms.
        </li>
        <li>
          <strong>Backups:</strong> data may persist in encrypted backups after deletion and is
          overwritten on our normal backup cycle.
        </li>
        <li>
          <strong>Billing, tax and contractual records:</strong> retained for as long as required by
          law, typically six years.
        </li>
        <li>
          <strong>Security, fraud-prevention and suppression records:</strong> retained where
          necessary — for example, an unsubscribe record must be kept so we do not email you again.
        </li>
      </ul>
      <p>
        Export your records before deleting your account if you are required to keep them. You can do
        this from Account settings, which stays available even if your subscription has lapsed.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Under UK and EU data protection law you have the right to access your personal data, to have
        it corrected or erased, to restrict or object to processing, to data portability, and to
        withdraw consent where we rely on it.
      </p>
      <p>
        To exercise any of these, email{" "}
        <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a>. We will
        respond within one month.
      </p>
      <p>
        If your data was given to Invoyr by one of our Customers — for example, because you are a
        client being invoiced through Invoyr — please contact that business directly, as they control
        that data. We will pass on any request we receive.
      </p>
      <p>
        You also have the right to complain to the Information Commissioner&rsquo;s Office at{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
          ico.org.uk
        </a>
        , or to your local supervisory authority.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Invoyr uses only the cookies it needs to work. We do not use advertising cookies and we do
        not run third-party analytics.
      </p>
      <ul>
        <li>
          <strong>Authentication cookies</strong> — keep you signed in and maintain your session.
        </li>
        <li>
          <strong>Active organisation cookie</strong> — remembers which business you are working in
          when you belong to more than one.
        </li>
        <li>
          <strong>Cloudflare Turnstile</strong> — sets a short-lived token to confirm sign-up and
          contact form submissions are not automated.
        </li>
      </ul>
      <p>
        These are strictly necessary for the Service, so they do not require consent. Blocking them
        will prevent the Service from working.
      </p>

      <h2>10. Security</h2>
      <p>
        We apply technical and organisational measures appropriate to the risk, including encryption
        in transit, row-level database access controls that isolate each business&rsquo;s data,
        encryption of stored banking tokens, rate limiting, anti-bot checks and audit logging of
        account activity.
      </p>
      <p>
        No internet service can be guaranteed completely secure. If a personal data breach occurs
        that is likely to result in a risk to your rights and freedoms, we will notify the ICO within
        72 hours where required, and notify you without undue delay where the risk is high.
      </p>

      <h2>11. Automated decision-making</h2>
      <p>
        We do not make decisions producing legal or similarly significant effects about you by
        automated means alone.
      </p>

      <h2>12. Children</h2>
      <p>
        Invoyr is a business service and is not directed at children. We do not knowingly collect
        personal data from anyone under 18.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        We may update this policy as the Service, our providers or the law change. Where a change
        materially affects you we will give reasonable notice before it takes effect. The date at the
        top of this page shows when it was last updated.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions, requests or complaints about privacy can be sent to:
        <br />
        Email: <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a>
        <br />
        Business: {LEGAL_ENTITY.tradingAs} / {LEGAL_ENTITY.name}
        <br />
        Address: {LEGAL_ENTITY.address}
      </p>
    </LegalDoc>
  );
}
