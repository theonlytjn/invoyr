import type { Metadata } from "next";
import LegalDoc from "@/components/marketing/LegalDoc";
import { LEGAL_ENTITY } from "@/config/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions — Invoyr",
  description: "The terms that govern your use of Invoyr.",
};

// Founder-supplied terms (28 Sep 2026). Entity details come from
// @/config/legal so this page and the Privacy Policy cannot drift apart; the
// company number clause renders only once the number is set there.
//
// STILL OUTSTANDING: sections 13 and 34 refer to a Data Processing Addendum
// that does not exist yet as a page, and legal counsel has not reviewed this.
export default function TermsPage() {
  return (
    <LegalDoc title="Terms & Conditions" lastUpdated="28 September 2026">
      <p>
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of Invoyr,
        including the Invoyr website, web application and related services (together, the
        &ldquo;Service&rdquo;).
      </p>
      <p>
        The Service is operated by <strong>{LEGAL_ENTITY.name}</strong>, trading as{" "}
        {LEGAL_ENTITY.tradingAs}, of {LEGAL_ENTITY.address}
        {LEGAL_ENTITY.companyNumber ? `, company number ${LEGAL_ENTITY.companyNumber}` : ""} (&ldquo;Invoyr&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;).
      </p>
      <p>
        By creating an account, starting a trial, purchasing a subscription or otherwise using the
        Service, you agree to these Terms.
      </p>

      <h2>1. Business use only</h2>
      <p>Invoyr is a business-to-business service.</p>
      <p>
        The Service is intended solely for businesses and individuals acting in the course of a
        business, trade or profession, including limited companies, partnerships, sole traders,
        freelancers and other business organisations.
      </p>
      <p>It is not intended for personal, family or household use.</p>
      <p>
        By creating an account or using the Service, you confirm that you are acting for business
        purposes and that you have authority to enter into these Terms on behalf of the relevant
        business where applicable.
      </p>

      <h2>2. The Service</h2>
      <p>
        Invoyr provides online business administration and financial management tools which may
        include:
      </p>
      <ul>
        <li>creating and managing invoices;</li>
        <li>recording customers and client information;</li>
        <li>recording payments and expenses;</li>
        <li>tracking invoice and payment status;</li>
        <li>sending invoices and related communications;</li>
        <li>automated invoice reminders and payment chasing;</li>
        <li>reporting and financial dashboards;</li>
        <li>payment integrations;</li>
        <li>bank or financial-data integrations;</li>
        <li>other business management functionality made available from time to time.</li>
      </ul>
      <p>Features may differ between subscription plans.</p>
      <p>
        We may improve, modify or replace features as the Service develops. Where a change would
        materially reduce functionality included in a paid plan, we will take reasonable steps to
        provide advance notice where practicable.
      </p>

      <h2>3. Accounts</h2>
      <p>You must provide accurate and current information when creating and maintaining your account.</p>
      <p>You are responsible for:</p>
      <ul>
        <li>keeping your login credentials secure;</li>
        <li>activity carried out through your account;</li>
        <li>ensuring authorised users comply with these Terms;</li>
        <li>promptly notifying us if you believe your account has been compromised.</li>
      </ul>
      <p>You must not share account credentials with unauthorised persons.</p>
      <p>
        We may implement additional authentication or security requirements where reasonably
        necessary to protect the Service or its users.
      </p>

      <h2>4. Subscription plans</h2>
      <p>Invoyr offers subscription plans with different features, allowances and pricing.</p>
      <p>
        The features and price applicable to your subscription will be displayed before you purchase
        or begin the relevant plan.
      </p>
      <p>Unless expressly stated otherwise, paid subscriptions are billed in advance.</p>
      <p>
        Where an annual subscription is selected, you will be charged the applicable annual
        subscription price.
      </p>
      <p>
        Prices are displayed exclusive or inclusive of VAT as indicated at checkout. Any applicable
        taxes will be shown where required.
      </p>

      <h2>5. Free trials</h2>
      <p>Where we offer a free trial, the length of the trial will be displayed when you subscribe.</p>
      <p>
        If payment details are required when starting a trial, we will make clear before you confirm
        your subscription that the subscription will automatically convert to a paid subscription at
        the end of the trial unless cancelled beforehand.
      </p>
      <p>If you do not wish to continue, you must cancel before the end of the trial.</p>
      <p>
        Unless otherwise stated at signup, cancellation during the trial prevents the first
        subscription payment from being taken.
      </p>

      <h2>6. Automatic renewal</h2>
      <p>
        Paid subscriptions automatically renew for the same billing period unless cancelled before
        the applicable renewal date.
      </p>
      <p>
        Your payment method will be charged the subscription price applicable to your plan at
        renewal.
      </p>
      <p>
        You authorise Invoyr and its payment provider to collect these recurring payments until your
        subscription is cancelled.
      </p>
      <p>
        We may send renewal or billing notifications where required by law or where we consider them
        appropriate.
      </p>

      <h2>7. Cancellation</h2>
      <p>
        You may cancel your subscription through your account or another cancellation method made
        available by Invoyr.
      </p>
      <p>
        Unless expressly stated otherwise, cancellation takes effect at the end of the period for
        which you have already paid.
      </p>
      <p>You may continue using the applicable paid features until that date.</p>
      <p>
        Cancelling a subscription does not normally entitle you to a refund for an unused portion of
        a billing period unless:
      </p>
      <ul>
        <li>we expressly agree otherwise;</li>
        <li>an error has occurred for which Invoyr is responsible; or</li>
        <li>a refund is required by applicable law.</li>
      </ul>

      <h2>8. Price changes</h2>
      <p>We may change subscription prices from time to time.</p>
      <p>A price change will not retrospectively alter a billing period that has already been paid.</p>
      <p>
        Where a price change affects your next renewal, we will provide reasonable advance notice
        before the new price is charged.
      </p>
      <p>You may cancel before renewal if you do not wish to continue at the new price.</p>

      <h2>9. Failed payments</h2>
      <p>If a subscription payment fails, we may:</p>
      <ul>
        <li>retry the payment;</li>
        <li>notify you of the failed payment;</li>
        <li>restrict paid functionality;</li>
        <li>downgrade the account;</li>
        <li>suspend the account; or</li>
        <li>terminate the subscription where payment remains outstanding.</li>
      </ul>
      <p>
        We will take reasonable steps to allow payment issues to be corrected before permanently
        deleting Customer Data.
      </p>

      <h2>10. Payment processing</h2>
      <p>
        Subscription payments may be processed by third-party payment providers such as Stripe.
      </p>
      <p>
        Invoyr does not ordinarily store complete payment-card details. Payment information is
        handled by the relevant payment provider under its own terms and privacy arrangements.
      </p>
      <p>
        The Service may also allow Invoyr customers to accept payments from their own clients through
        supported payment integrations.
      </p>
      <p>
        Any transaction between a Customer and its client remains a transaction between those
        parties. Invoyr is not a party to the underlying invoice, contract, sale or service.
      </p>

      <h2>11. Multi-currency functionality</h2>
      <p>
        The Service may support multiple currencies and payment processing in currencies supported by
        relevant payment providers.
      </p>
      <p>
        Currency availability, conversion, settlement and fees may depend on third-party providers.
      </p>
      <p>
        Customers are responsible for ensuring that invoices, currency selections, exchange-rate
        treatment, accounting treatment and tax treatment are appropriate for their business and
        jurisdiction.
      </p>

      <h2>12. Customer Data</h2>
      <p>
        &ldquo;Customer Data&rdquo; means information, documents and other data submitted to,
        generated through or stored within the Service by or on behalf of a Customer, including
        client information, invoices, payment records, expenses and related business records.
      </p>
      <p>As between Invoyr and the Customer, the Customer retains its rights in Customer Data.</p>
      <p>
        You grant Invoyr the limited rights necessary to host, process, transmit, back up and
        otherwise handle Customer Data for the purpose of providing, securing, maintaining and
        supporting the Service and complying with applicable law.
      </p>
      <p>We do not acquire ownership of your Customer Data.</p>

      <h2>13. Personal data contained in Customer Data</h2>
      <p>
        Where Customer Data contains personal data relating to your customers, clients, employees,
        contractors or other individuals:
      </p>
      <ul>
        <li>
          you are responsible for determining the lawful purposes and lawful basis for processing
          that data;
        </li>
        <li>you are responsible for providing any privacy information required by applicable law;</li>
        <li>you must ensure you have the right to provide the information to Invoyr;</li>
        <li>
          you remain responsible for instructions you give Invoyr concerning that information; and
        </li>
        <li>
          Invoyr will generally process that information on your behalf as a data processor.
        </li>
      </ul>
      <p>Our Data Processing Addendum forms part of these Terms and governs this processing.</p>

      <h2>14. Automated invoice reminders and chasing</h2>
      <p>
        Certain plans may allow Customers to enable automated invoice reminders or payment-chasing
        communications.
      </p>
      <p>
        These features are optional and operate only when enabled or configured by the Customer.
      </p>
      <p>
        Where enabled, the Customer instructs Invoyr to process relevant client contact information,
        invoice information and payment status for the purpose of sending those communications.
      </p>
      <p>The Customer is responsible for:</p>
      <ul>
        <li>ensuring it has a lawful basis for processing the recipient&rsquo;s information;</li>
        <li>ensuring communications are appropriate and lawful;</li>
        <li>ensuring contact information and invoice information are accurate;</li>
        <li>selecting appropriate reminder settings;</li>
        <li>disabling automated communications where they are no longer appropriate; and</li>
        <li>handling disputes concerning the underlying invoice or debt.</li>
      </ul>
      <p>
        Invoyr provides the technical communication functionality but is not a debt collection agency
        and does not determine whether an underlying amount is legally due.
      </p>

      <h2>15. Third-party services and integrations</h2>
      <p>
        Invoyr may integrate with third-party services including payment providers, banking or Open
        Banking providers, email providers and other business applications.
      </p>
      <p>
        These may include providers such as Stripe, TrueLayer, PayPal and other services made
        available from time to time.
      </p>
      <p>Your use of a third-party service may also be governed by that provider&rsquo;s terms.</p>
      <p>
        We are not responsible for third-party services outside our reasonable control, including
        their availability, changes, suspension or termination.
      </p>
      <p>
        We may change or discontinue an integration if the relevant provider changes or withdraws its
        service or where reasonably necessary for security, legal or technical reasons.
      </p>

      <h2>16. Bank and financial-data integrations</h2>
      <p>
        Where you connect a bank account or other financial account through a supported provider, you
        authorise the relevant provider and Invoyr to process the information necessary to provide
        the requested functionality.
      </p>
      <p>
        Invoyr does not operate your bank account and cannot guarantee the accuracy or availability
        of information supplied by banks or financial-data providers.
      </p>
      <p>
        You should verify important financial information against your official banking and
        accounting records.
      </p>

      <h2>17. Your responsibilities</h2>
      <p>You are responsible for:</p>
      <ul>
        <li>information entered into the Service;</li>
        <li>the accuracy of invoices and financial records;</li>
        <li>determining applicable VAT, taxes and accounting treatment;</li>
        <li>maintaining records required by law;</li>
        <li>checking reports before relying on them;</li>
        <li>the legality of communications sent through your account;</li>
        <li>obtaining necessary permissions from individuals whose information you process;</li>
        <li>
          maintaining appropriate copies or exports of records where required for your business.
        </li>
      </ul>

      <h2>18. No accounting, tax or legal advice</h2>
      <p>Invoyr provides software tools.</p>
      <p>Invoyr is not your accountant, tax adviser, solicitor or financial adviser.</p>
      <p>
        Information, calculations, reports, reminders, dashboards and other outputs generated through
        the Service are provided as business administration tools and do not constitute professional
        accounting, tax, financial or legal advice.
      </p>
      <p>
        You remain responsible for your financial records, tax returns, VAT treatment, statutory
        obligations and business decisions.
      </p>
      <p>You should obtain professional advice where appropriate.</p>

      <h2>19. Acceptable use</h2>
      <p>You must not use the Service:</p>
      <ul>
        <li>unlawfully or fraudulently;</li>
        <li>to impersonate another person or business;</li>
        <li>to send unlawful, deceptive, abusive or malicious communications;</li>
        <li>to store or distribute malware;</li>
        <li>to attempt unauthorised access to the Service or another user&rsquo;s data;</li>
        <li>to interfere with the security or operation of the Service;</li>
        <li>to reverse engineer the Service except where expressly permitted by law;</li>
        <li>to conduct vulnerability testing without our written permission;</li>
        <li>to upload information you do not have the right to process;</li>
        <li>
          to use the Service in a way that materially harms Invoyr, its infrastructure or other
          users.
        </li>
      </ul>
      <p>
        We may investigate suspected misuse and may restrict or suspend access where reasonably
        necessary.
      </p>

      <h2>20. Intellectual property</h2>
      <p>
        Invoyr and its licensors retain all intellectual-property rights in the Service, including
        its software, interface, design, branding, documentation and underlying technology.
      </p>
      <p>
        Subject to these Terms and payment of applicable fees, we grant you a limited, non-exclusive,
        non-transferable right to use the Service for your internal business purposes during your
        subscription.
      </p>
      <p>No ownership of the Service or its intellectual property is transferred to you.</p>

      <h2>21. Feedback</h2>
      <p>
        If you voluntarily provide suggestions or feedback about the Service, you permit us to use
        that feedback to improve Invoyr without restriction or payment, provided that doing so does
        not give us ownership of your Customer Data.
      </p>

      <h2>22. Service availability</h2>
      <p>
        We aim to provide a reliable Service but do not guarantee uninterrupted or error-free
        availability.
      </p>
      <p>The Service may occasionally be unavailable because of:</p>
      <ul>
        <li>maintenance;</li>
        <li>updates;</li>
        <li>infrastructure failures;</li>
        <li>third-party service failures;</li>
        <li>internet or telecommunications failures;</li>
        <li>security incidents; or</li>
        <li>circumstances outside our reasonable control.</li>
      </ul>
      <p>Where practicable, we will seek to minimise disruption.</p>

      <h2>23. Security</h2>
      <p>
        We maintain technical and organisational measures designed to protect information processed
        through the Service.
      </p>
      <p>No internet-based system can be guaranteed to be completely secure.</p>
      <p>
        You are responsible for using appropriate passwords, protecting account credentials and
        maintaining reasonable security over devices used to access Invoyr.
      </p>

      <h2>24. Suspension</h2>
      <p>
        We may temporarily suspend or restrict an account where reasonably necessary because of:
      </p>
      <ul>
        <li>non-payment;</li>
        <li>suspected unauthorised access;</li>
        <li>security risk;</li>
        <li>unlawful activity;</li>
        <li>material breach of these Terms;</li>
        <li>risk to other users or the Service;</li>
        <li>a legal or regulatory requirement.</li>
      </ul>
      <p>
        Where appropriate and legally permitted, we will attempt to notify you and provide an
        opportunity to resolve the issue.
      </p>

      <h2>25. Termination</h2>
      <p>
        You may stop using the Service and cancel your subscription in accordance with these Terms.
      </p>
      <p>We may terminate an account where:</p>
      <ul>
        <li>
          you materially breach these Terms and fail to remedy the breach where it is capable of
          remedy;
        </li>
        <li>fees remain unpaid;</li>
        <li>use of the Service creates a material legal or security risk;</li>
        <li>we are required to do so by law; or</li>
        <li>we discontinue the Service.</li>
      </ul>
      <p>Where reasonably practicable, we will provide notice before termination.</p>

      <h2>26. Data following termination</h2>
      <p>
        Following termination or account deletion, Customer Data will ordinarily be scheduled for
        deletion from active systems within 7 days, unless:
      </p>
      <ul>
        <li>you request deletion sooner and this is technically and legally possible;</li>
        <li>we are legally required to retain particular information;</li>
        <li>
          information must temporarily be retained for security, fraud prevention, dispute resolution
          or legal claims; or
        </li>
        <li>information remains temporarily within encrypted or otherwise protected backup systems.</li>
      </ul>
      <p>
        Information retained in backups will be deleted or overwritten in accordance with our normal
        backup-retention cycle and will not ordinarily be restored except for disaster recovery,
        security or continuity purposes.
      </p>
      <p>
        Certain information held by Invoyr in its separate capacity as a data controller — such as
        billing, tax, contractual, security or suppression records — may be retained for longer where
        reasonably necessary or legally required.
      </p>
      <p>
        Where export functionality is available, Customers should export records they are required to
        retain before deleting their account.
      </p>

      <h2>27. Confidentiality</h2>
      <p>
        Each party will take reasonable steps to protect confidential information received from the
        other and will use it only for purposes connected with the Service, except where disclosure
        is required by law.
      </p>
      <p>Customer Data will be treated as confidential information.</p>

      <h2>28. Disclaimer of warranties</h2>
      <p>The Service is provided on an &ldquo;as available&rdquo; basis.</p>
      <p>To the extent permitted by law, we do not warrant that the Service will:</p>
      <ul>
        <li>always be available;</li>
        <li>be completely free from errors;</li>
        <li>meet every individual business requirement; or</li>
        <li>make Customer Data or third-party information inherently accurate.</li>
      </ul>
      <p>Nothing in these Terms excludes warranties or obligations that cannot lawfully be excluded.</p>

      <h2>29. Liability</h2>
      <p>
        Nothing in these Terms excludes or limits liability where it would be unlawful to do so,
        including liability for:
      </p>
      <ul>
        <li>death or personal injury caused by negligence;</li>
        <li>fraud or fraudulent misrepresentation; or</li>
        <li>any other liability that cannot legally be excluded or limited.</li>
      </ul>
      <p>
        Subject to the above, Invoyr will not be liable for indirect or consequential losses or for
        loss of profit, revenue, anticipated savings, business opportunity or goodwill arising from
        use of the Service.
      </p>
      <p>
        Invoyr will not be responsible for losses caused by inaccurate information supplied by a
        Customer, decisions made on the basis of unverified financial information, or failures of
        third-party services outside our reasonable control.
      </p>
      <p>
        Subject to liabilities that cannot lawfully be limited, Invoyr&rsquo;s total aggregate
        liability arising out of or in connection with the Service during any twelve-month period
        will not exceed the total subscription fees paid or payable by the Customer to Invoyr during
        the twelve months immediately preceding the event giving rise to the claim.
      </p>

      <h2>30. Indemnity</h2>
      <p>
        You will be responsible for losses, liabilities, claims and reasonable costs incurred by
        Invoyr to the extent they result from your unlawful use of the Service, unlawful Customer
        Data, or material breach of these Terms, except to the extent caused by Invoyr.
      </p>

      <h2>31. Changes to these Terms</h2>
      <p>
        We may update these Terms to reflect changes to the Service, law, security requirements or
        our business.
      </p>
      <p>
        Where a change materially affects existing paid Customers, we will provide reasonable notice
        before it takes effect unless an immediate change is necessary for legal or security reasons.
      </p>
      <p>Continued use after the effective date constitutes acceptance of the updated Terms.</p>
      <p>
        If you do not accept a material change, you may cancel your subscription before the change
        takes effect.
      </p>

      <h2>32. Notices</h2>
      <p>
        We may provide Service-related notices electronically, including through the Service or to
        the email address associated with your account.
      </p>
      <p>You are responsible for keeping your account contact information current.</p>

      <h2>33. Assignment</h2>
      <p>You may not assign your rights under these Terms without our written consent.</p>
      <p>
        We may assign these Terms in connection with a merger, acquisition, corporate restructuring
        or sale of all or substantially all of the relevant business or assets, provided this does
        not materially reduce your rights.
      </p>

      <h2>34. Entire agreement</h2>
      <p>
        These Terms, our Privacy Policy and the Data Processing Addendum, together with any
        plan-specific terms expressly presented to you, constitute the agreement between you and
        Invoyr concerning the Service.
      </p>

      <h2>35. Severability</h2>
      <p>
        If any provision is found to be invalid or unenforceable, the remaining provisions will
        continue in effect.
      </p>

      <h2>36. No waiver</h2>
      <p>
        Failure to enforce a provision of these Terms does not waive our right to enforce it later.
      </p>

      <h2>37. Governing law and jurisdiction</h2>
      <p>
        These Terms and any non-contractual obligations arising from them are governed by the laws of{" "}
        {LEGAL_ENTITY.jurisdiction}.
      </p>
      <p>
        The courts of {LEGAL_ENTITY.jurisdiction} will have exclusive jurisdiction over disputes
        arising from or relating to these Terms, subject to any mandatory rule of law that applies
        otherwise.
      </p>

      <h2>38. Contact</h2>
      <p>Questions about these Terms may be sent to:</p>
      <p>
        Email: <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a>
        <br />
        Business: {LEGAL_ENTITY.tradingAs} / {LEGAL_ENTITY.name}
        <br />
        Address: {LEGAL_ENTITY.address}
      </p>
    </LegalDoc>
  );
}
