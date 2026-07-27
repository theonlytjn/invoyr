import type { Metadata } from "next";
import LegalDoc from "@/components/marketing/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy Policy — Invoyr",
  description: "How Invoyr collects, uses, and protects your personal data.",
};

// NOTE: Starter policy with Invoyr Ltd's real entity/address filled in. Still
// should be reviewed by legal counsel before launch (and add an ICO
// registration reference if/when registered).
export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" lastUpdated="27 July 2026">
      <p>
        This Privacy Policy explains how <strong>Invoyr Ltd</strong> (&ldquo;Invoyr&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects your personal data when you
        use Invoyr and its related services (the &ldquo;Service&rdquo;). We are the data controller for
        the personal data described here. If you have any questions, contact us at{" "}
        <a href="mailto:support@invoyr.io">support@invoyr.io</a>.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li><strong>Account data</strong> — your name, email address, and password (stored hashed).</li>
        <li><strong>Business &amp; invoicing data</strong> — your organisation details, clients, invoices, estimates, expenses, and related records you enter.</li>
        <li><strong>Payment data</strong> — processed by our payment providers; we store transaction records and identifiers, not full card details.</li>
        <li><strong>Bank data</strong> — where you connect Open Banking, transaction and account information retrieved via our provider with your consent.</li>
        <li><strong>Usage &amp; technical data</strong> — log data, device/browser information, and cookies necessary to run and secure the Service.</li>
      </ul>

      <h2>2. How we use your data</h2>
      <ul>
        <li>To provide, maintain, and secure the Service and your account.</li>
        <li>To process invoices and payments and to send transactional emails (e.g. receipts, reminders).</li>
        <li>To provide support and respond to your requests.</li>
        <li>To send marketing emails <strong>only where you have opted in</strong>; you can unsubscribe at any time.</li>
        <li>To comply with our legal obligations and prevent fraud or abuse.</li>
      </ul>

      <h2>3. Legal bases (UK GDPR / EU GDPR)</h2>
      <p>
        We rely on: <strong>performance of a contract</strong> (to provide the Service);{" "}
        <strong>legitimate interests</strong> (to secure and improve the Service);{" "}
        <strong>consent</strong> (for marketing email and Open Banking connections); and{" "}
        <strong>legal obligation</strong> (e.g. tax and accounting records).
      </p>

      <h2>4. Sharing &amp; sub-processors</h2>
      <p>We share data only with providers that help us run the Service, under appropriate data-processing terms:</p>
      <ul>
        <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
        <li><strong>Stripe</strong> and <strong>PayPal</strong> — payment processing.</li>
        <li><strong>Resend</strong> — transactional and (opt-in) marketing email delivery.</li>
        <li><strong>TrueLayer</strong> — Open Banking connectivity (only when you connect a bank).</li>
        <li><strong>Vercel</strong> — application hosting.</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>5. International transfers</h2>
      <p>
        Some providers may process data outside the UK/EEA. Where they do, we rely on appropriate
        safeguards such as Standard Contractual Clauses or an adequacy decision.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We keep personal data for as long as your account is active and as needed to provide the
        Service, then for any period required by law (e.g. financial records). You can request
        deletion as described below.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on your location, you may have the right to access, correct, delete, restrict, or
        port your data, to object to certain processing, and to withdraw consent. California residents
        (CCPA/CPRA) have rights to know, delete, correct, and opt out of &ldquo;sale&rdquo;/&ldquo;sharing&rdquo;
        of personal information — we do not sell or share personal information in that sense. To exercise
        any right, email <a href="mailto:support@invoyr.io">support@invoyr.io</a>. You may also lodge a
        complaint with your local data-protection authority (in the UK, the ICO).
      </p>

      <h2>8. Cookies</h2>
      <p>
        We use cookies that are strictly necessary to sign you in, keep the Service secure, and
        remember your preferences. We do not use third-party advertising cookies.
      </p>

      <h2>9. Security</h2>
      <p>
        We use industry-standard measures including encryption in transit, access controls, and
        row-level database isolation between organisations. No system is perfectly secure, but we work
        to protect your data and will notify you of any breach as required by law.
      </p>

      <h2>10. Children</h2>
      <p>The Service is not directed to anyone under 18, and we do not knowingly collect their data.</p>

      <h2>11. Changes</h2>
      <p>
        We may update this policy from time to time. We will post the updated version here and revise
        the &ldquo;Last updated&rdquo; date above.
      </p>

      <h2>12. Contact</h2>
      <p>
        <strong>Invoyr Ltd</strong>, 128 City Road, London, United Kingdom, EC1V 2NX. Email:{" "}
        <a href="mailto:support@invoyr.io">support@invoyr.io</a>.
      </p>
    </LegalDoc>
  );
}
