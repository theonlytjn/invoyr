import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc from "@/components/marketing/LegalDoc";
import { LEGAL_ENTITY, SUB_PROCESSORS } from "@/config/legal";

export const metadata: Metadata = {
  title: "Data Processing Addendum — Invoyr",
  description:
    "How Invoyr processes personal data on behalf of its customers, under UK and EU GDPR.",
};

// Created 28 Sep 2026 because the Terms (sections 13 and 34) state that a DPA
// forms part of the agreement, and no such document existed.
//
// DRAFT FOR LEGAL REVIEW — structured around UK GDPR Article 28(3), which sets
// out what a processor contract must contain. Counsel should check in
// particular: the audit provisions (clause 9), the liability position, and
// whether a signed counterpart is needed for enterprise customers.
export default function DpaPage() {
  return (
    <LegalDoc title="Data Processing Addendum" lastUpdated="28 September 2026">
      <p>
        This Data Processing Addendum (&ldquo;DPA&rdquo;) forms part of the{" "}
        <Link href="/terms">Terms &amp; Conditions</Link> between{" "}
        <strong>{LEGAL_ENTITY.name}</strong>
        {LEGAL_ENTITY.companyNumber ? `, company number ${LEGAL_ENTITY.companyNumber}` : ""} (&ldquo;Invoyr&rdquo;,
        the &ldquo;Processor&rdquo;) and the customer agreeing to those Terms (the
        &ldquo;Customer&rdquo;, the &ldquo;Controller&rdquo;).
      </p>
      <p>
        It applies where Invoyr processes personal data on the Customer&rsquo;s behalf, and is
        designed to meet Article 28 of the UK GDPR and the EU GDPR. Where this DPA conflicts with
        the Terms on the subject of data protection, this DPA prevails.
      </p>
      <p>
        Terms such as &ldquo;controller&rdquo;, &ldquo;processor&rdquo;, &ldquo;data subject&rdquo;,
        &ldquo;personal data&rdquo; and &ldquo;processing&rdquo; have the meanings given in
        applicable data protection law. &ldquo;Customer Data&rdquo; has the meaning given in the
        Terms.
      </p>

      <h2>1. Roles of the parties</h2>
      <p>
        The Customer is the controller of personal data contained in Customer Data. Invoyr is the
        processor of that data and processes it only on the Customer&rsquo;s documented
        instructions.
      </p>
      <p>
        Invoyr is a separate controller for account, billing, security and usage data relating to
        the Customer itself. That processing is governed by the{" "}
        <Link href="/privacy">Privacy Policy</Link>, not this DPA.
      </p>

      <h2>2. Subject matter, duration, nature and purpose</h2>
      <ul>
        <li>
          <strong>Subject matter:</strong> provision of the Invoyr invoicing and business
          administration service.
        </li>
        <li>
          <strong>Duration:</strong> for the term of the Customer&rsquo;s subscription, plus the
          deletion periods described in clause 11.
        </li>
        <li>
          <strong>Nature and purpose:</strong> hosting, storing, organising, retrieving, displaying,
          transmitting, backing up and deleting Customer Data so the Customer can create and send
          invoices, manage clients, record payments and expenses, and — where the Customer enables
          it — send reminders to its clients.
        </li>
      </ul>

      <h2>3. Types of personal data</h2>
      <p>Determined by what the Customer chooses to enter, but typically:</p>
      <ul>
        <li>names and business names of the Customer&rsquo;s clients;</li>
        <li>contact details, including email addresses, phone numbers and postal addresses;</li>
        <li>
          invoice, estimate and credit note contents, including line-item descriptions of goods or
          services;
        </li>
        <li>payment records, amounts, payment status and payment references;</li>
        <li>expense records and any receipts or attachments uploaded;</li>
        <li>
          where the Customer connects a bank account, transaction data including counterparty names
          and references;
        </li>
        <li>names and email addresses of the Customer&rsquo;s own team members invited to the account.</li>
      </ul>
      <p>
        Invoyr does not require special category data, and the Service is not designed to process it.
        The Customer should not enter special category data into free-text fields.
      </p>

      <h2>4. Categories of data subjects</h2>
      <ul>
        <li>the Customer&rsquo;s clients and their staff or contacts;</li>
        <li>the Customer&rsquo;s own team members and authorised users;</li>
        <li>suppliers or counterparties appearing in expense or bank transaction records.</li>
      </ul>

      <h2>5. Invoyr&rsquo;s obligations</h2>
      <p>Invoyr will:</p>
      <ul>
        <li>
          process Customer Data only on the Customer&rsquo;s documented instructions, including as
          to international transfers, unless required to do otherwise by law — in which case it will
          inform the Customer first, unless the law prohibits that;
        </li>
        <li>
          ensure that personnel authorised to process Customer Data are bound by confidentiality;
        </li>
        <li>implement the security measures described in clause 7;</li>
        <li>respect the conditions in clause 8 for engaging another processor;</li>
        <li>
          assist the Customer, so far as reasonably possible, in responding to data subject requests;
        </li>
        <li>
          assist the Customer with security, breach notification, data protection impact assessments
          and prior consultation, taking into account the nature of processing and the information
          available to Invoyr;
        </li>
        <li>delete or return Customer Data as set out in clause 11; and</li>
        <li>
          make available the information reasonably necessary to demonstrate compliance with this
          DPA, as set out in clause 9.
        </li>
      </ul>
      <p>
        The Terms, this DPA and the Customer&rsquo;s use of the Service&rsquo;s features constitute
        the Customer&rsquo;s complete documented instructions. Invoyr will notify the Customer if it
        believes an instruction infringes data protection law.
      </p>

      <h2>6. Customer&rsquo;s obligations</h2>
      <p>The Customer:</p>
      <ul>
        <li>
          is responsible for the accuracy, quality and legality of Customer Data and for how it was
          obtained;
        </li>
        <li>
          must have a lawful basis for the processing it instructs, including for any automated
          reminders sent to its clients;
        </li>
        <li>must provide its own privacy information to its clients and other data subjects;</li>
        <li>
          must configure the Service, manage user access and remove users appropriately for its own
          security needs.
        </li>
      </ul>

      <h2>7. Security measures</h2>
      <p>
        Invoyr maintains technical and organisational measures appropriate to the risk, including:
      </p>
      <ul>
        <li>encryption of data in transit, and encryption of stored banking access tokens;</li>
        <li>
          row-level database security so that each business&rsquo;s data is isolated and cannot be
          read by another;
        </li>
        <li>role-based access control within a customer account;</li>
        <li>authentication protections including leaked-password checks and anti-bot verification;</li>
        <li>rate limiting on public endpoints;</li>
        <li>audit logging of significant account activity;</li>
        <li>regular backups, and restricted administrative access to production systems.</li>
      </ul>
      <p>
        Invoyr may update these measures as the Service evolves, provided the level of protection is
        not materially reduced.
      </p>

      <h2>8. Sub-processors</h2>
      <p>
        The Customer gives general authorisation for Invoyr to engage the sub-processors listed
        below. Each is engaged under a written contract imposing data protection obligations no less
        protective than those in this DPA, and Invoyr remains liable for their performance.
      </p>
      <ul>
        {SUB_PROCESSORS.map((provider) => (
          <li key={provider.name}>
            <strong>{provider.name}</strong> — {provider.purpose}. Processed in: {provider.location}.
          </li>
        ))}
      </ul>
      <p>
        Invoyr will give reasonable notice before adding or replacing a sub-processor. If the
        Customer reasonably objects on data protection grounds, it may raise the objection with
        Invoyr and, if no reasonable resolution is available, terminate the affected part of the
        Service.
      </p>

      <h2>9. Audit and information</h2>
      <p>
        Invoyr will make available the information reasonably necessary to demonstrate compliance
        with Article 28, and will contribute to audits or inspections conducted by the Customer or a
        mandated auditor.
      </p>
      <p>
        In practice, Invoyr will first provide written responses to reasonable security
        questionnaires and any available documentation. An on-site or hands-on audit may be
        requested where that is insufficient and is required by law or a supervisory authority,
        subject to reasonable notice, no more than once in any twelve-month period except following
        a personal data breach, during business hours, without disrupting the Service, and subject to
        confidentiality. Invoyr may charge for time spent beyond a reasonable level of assistance.
      </p>

      <h2>10. Personal data breaches</h2>
      <p>
        Invoyr will notify the Customer without undue delay after becoming aware of a personal data
        breach affecting Customer Data, and will provide the information reasonably available to it
        — the nature of the breach, the categories and approximate number of data subjects and
        records concerned, the likely consequences, and the measures taken or proposed.
      </p>
      <p>
        Notification is not an admission of fault. Responsibility for notifying a supervisory
        authority or affected data subjects about Customer Data rests with the Customer as
        controller, and Invoyr will provide reasonable assistance.
      </p>

      <h2>11. Deletion and return</h2>
      <p>
        The Customer may export Customer Data at any time while its account exists, including after
        a subscription lapses.
      </p>
      <p>
        Following termination or account deletion, Invoyr will delete Customer Data from active
        systems in accordance with the Terms — ordinarily within 7 days — unless retention is
        required by law, or is temporarily necessary for security, fraud prevention, dispute
        resolution or legal claims.
      </p>
      <p>
        Data may remain in encrypted backups after deletion and will be overwritten on Invoyr&rsquo;s
        normal backup-retention cycle. It will not be restored except for disaster recovery, security
        or continuity purposes.
      </p>

      <h2>12. International transfers</h2>
      <p>
        Customer Data is stored at rest in the European Union. Certain sub-processors listed in
        clause 8 process personal data in the United States or across a global network.
      </p>
      <p>
        Where personal data is transferred outside the UK or EEA, Invoyr relies on an appropriate
        transfer mechanism, including the European Commission&rsquo;s Standard Contractual Clauses
        and the UK International Data Transfer Agreement or Addendum, together with supplementary
        measures where required.
      </p>

      <h2>13. Liability</h2>
      <p>
        Each party&rsquo;s liability under this DPA is subject to the limitations and exclusions in
        the Terms, except to the extent that applicable law does not permit those limitations.
      </p>

      <h2>14. Duration and changes</h2>
      <p>
        This DPA takes effect when the Customer accepts the Terms and continues while Invoyr
        processes Customer Data.
      </p>
      <p>
        Invoyr may update this DPA to reflect changes in law, guidance, sub-processors or the
        Service, provided the update does not materially reduce the protections it provides. The
        date at the top of this page shows when it was last updated.
      </p>

      <h2>15. Contact</h2>
      <p>
        Data protection queries, including requests for a signed counterpart of this DPA, can be
        sent to:
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
