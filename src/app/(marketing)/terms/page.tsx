import type { Metadata } from "next";
import LegalDoc from "@/components/marketing/LegalDoc";

export const metadata: Metadata = {
  title: "Terms of Service — Invoyr",
  description: "The terms that govern your use of Invoyr.",
};

// NOTE: Starter terms with Invoyr Ltd's real entity + governing law filled in.
// Still should be reviewed by legal counsel before launch.
export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" lastUpdated="27 July 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Invoyr, provided by{" "}
        <strong>Invoyr Ltd</strong> (&ldquo;Invoyr&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By
        creating an account or using the Service you agree to these Terms. If you do not agree, do not
        use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Invoyr provides invoicing, payment, expense, and related tools for businesses. We may add,
        change, or remove features over time.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must provide accurate information and are responsible for activity under your account.</li>
        <li>Keep your credentials secure; notify us promptly of any unauthorised use.</li>
        <li>You must be at least 18 and able to form a binding contract.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to misuse the Service, including by attempting to breach security, disrupt the Service, infringe others&rsquo; rights, or use it for unlawful, fraudulent, or abusive purposes.</p>

      <h2>4. Payments &amp; subscriptions</h2>
      <ul>
        <li>Paid plans are billed in advance on a recurring basis via our payment providers.</li>
        <li>Fees are exclusive of taxes unless stated; you are responsible for applicable taxes.</li>
        <li>You can cancel at any time; access continues until the end of the current billing period. Except where required by law, fees already paid are non-refundable.</li>
        <li>Payments you collect from your own clients are processed through your connected Stripe/PayPal accounts and are subject to those providers&rsquo; terms.</li>
      </ul>

      <h2>5. Your content</h2>
      <p>
        You retain ownership of the data and content you put into the Service. You grant us the limited
        rights needed to host and process it to provide the Service. You are responsible for the content
        you create and for complying with laws applicable to your business and your clients.
      </p>

      <h2>6. Third-party services</h2>
      <p>
        The Service integrates with third parties (e.g. Stripe, PayPal, TrueLayer). Your use of those
        integrations is subject to their terms, and we are not responsible for their acts or omissions.
      </p>

      <h2>7. Availability</h2>
      <p>
        We work to keep the Service available but do not guarantee uninterrupted or error-free operation.
        We may suspend the Service for maintenance or to protect its security or integrity.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access if you breach these
        Terms or where required to protect the Service or other users. On termination, your right to use
        the Service ends; provisions that by nature should survive will survive.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any kind to the fullest extent
        permitted by law. Invoyr is a tool and does not provide legal, tax, or accounting advice.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Invoyr will not be liable for indirect, incidental, or
        consequential damages, and our total liability for any claim is limited to the amounts you paid us
        for the Service in the 12 months before the claim.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will post the updated version here and revise the
        &ldquo;Last updated&rdquo; date. Continued use after changes means you accept them.
      </p>

      <h2>12. Governing law &amp; contact</h2>
      <p>
        These Terms are governed by the laws of <strong>England and Wales</strong>. Questions? Email{" "}
        <a href="mailto:support@invoyr.io">support@invoyr.io</a>.
      </p>
    </LegalDoc>
  );
}
