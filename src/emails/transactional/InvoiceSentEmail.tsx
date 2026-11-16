import { Heading, Text, Hr, Section } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { InvoiceSummary } from "../components/InvoiceSummary";
import { EMAIL_COLORS } from "../theme";
import { INVOICE_SENT_COPY as COPY } from "@/config/email-copy";

export interface BankDetails {
  accountName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  sortCode?: string | null;
  iban?: string | null;
  bic?: string | null;
}

export interface InvoiceSentEmailProps {
  clientName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  invoiceNumber: string;
  /** The amount the client owes, after any discount. */
  invoiceTotal: string;
  /** Amount before the discount. Pass with `discount` so the client can see how the total was reached. */
  totalBeforeDiscount?: string;
  discount?: string;
  discountReason?: string | null;
  issueDate?: string;
  dueDate?: string;
  payUrl: string;
  bankDetails?: BankDetails | null;
  /** The sender's own note from the compose box, shown above the summary. */
  message?: string | null;
}

export function InvoiceSentEmail({
  clientName,
  orgName,
  logoUrl,
  accentColor = EMAIL_COLORS.ink,
  invoiceNumber,
  invoiceTotal,
  totalBeforeDiscount,
  discount,
  discountReason,
  issueDate,
  dueDate,
  payUrl,
  bankDetails,
  message,
}: InvoiceSentEmailProps) {
  const hasBankDetails =
    bankDetails?.accountName || bankDetails?.accountNumber;

  return (
    <TransactionalLayout
      preview={COPY.preview(orgName, invoiceTotal)}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 4px" }}
      >
        {COPY.heading(invoiceNumber)}
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
        {COPY.greeting(clientName)}
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
        {COPY.intro(orgName, invoiceNumber, invoiceTotal)}
      </Text>
      {message?.trim() && (
        <Section
          style={{
            borderLeft: `3px solid ${accentColor}`,
            backgroundColor: EMAIL_COLORS.panel,
            padding: "12px 16px",
            margin: "0 0 20px",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: 600, color: EMAIL_COLORS.muted, margin: "0 0 6px" }}>
            {COPY.messageLabel(orgName)}
          </Text>
          {message
            .trim()
            .split(/\n{2,}/)
            .map((para, i) => (
              <Text
                key={i}
                style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 8px", whiteSpace: "pre-line" }}
              >
                {para}
              </Text>
            ))}
        </Section>
      )}
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 4px" }}>
        {COPY.howToPay}
      </Text>

      <InvoiceSummary
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        dueDate={dueDate}
        total={invoiceTotal}
        totalBeforeDiscount={totalBeforeDiscount}
        discount={discount}
        discountReason={discountReason}
        accentColor={accentColor}
      />

      <EmailButton href={payUrl} accentColor={accentColor}>
        {COPY.cta}
      </EmailButton>

      {hasBankDetails && (
        <>
          <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "28px 0 20px" }} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: EMAIL_COLORS.subtle,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 12px",
            }}
          >
            {COPY.bankHeading}
          </Text>
          <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
            {bankDetails?.accountName && (
              <tr>
                <td style={{ color: EMAIL_COLORS.muted, paddingRight: 16, paddingBottom: 4 }}>Account name</td>
                <td style={{ fontWeight: 600, color: EMAIL_COLORS.ink }}>{bankDetails.accountName}</td>
              </tr>
            )}
            {bankDetails?.bankName && (
              <tr>
                <td style={{ color: EMAIL_COLORS.muted, paddingRight: 16, paddingBottom: 4 }}>Bank</td>
                <td style={{ fontWeight: 600, color: EMAIL_COLORS.ink }}>{bankDetails.bankName}</td>
              </tr>
            )}
            {bankDetails?.accountNumber && (
              <tr>
                <td style={{ color: EMAIL_COLORS.muted, paddingRight: 16, paddingBottom: 4 }}>Account number</td>
                <td style={{ fontWeight: 600, color: EMAIL_COLORS.ink }}>{bankDetails.accountNumber}</td>
              </tr>
            )}
            {bankDetails?.sortCode && (
              <tr>
                <td style={{ color: EMAIL_COLORS.muted, paddingRight: 16, paddingBottom: 4 }}>Sort code</td>
                <td style={{ fontWeight: 600, color: EMAIL_COLORS.ink }}>{bankDetails.sortCode}</td>
              </tr>
            )}
            {bankDetails?.iban && (
              <tr>
                <td style={{ color: EMAIL_COLORS.muted, paddingRight: 16, paddingBottom: 4 }}>IBAN</td>
                <td style={{ fontWeight: 600, color: EMAIL_COLORS.ink }}>{bankDetails.iban}</td>
              </tr>
            )}
            {bankDetails?.bic && (
              <tr>
                <td style={{ color: EMAIL_COLORS.muted, paddingRight: 16, paddingBottom: 4 }}>BIC / SWIFT</td>
                <td style={{ fontWeight: 600, color: EMAIL_COLORS.ink }}>{bankDetails.bic}</td>
              </tr>
            )}
          </table>
          <Text style={{ fontSize: 12, color: EMAIL_COLORS.subtle, margin: "8px 0 0" }}>
            {COPY.bankReference} <strong style={{ color: EMAIL_COLORS.muted }}>{invoiceNumber}</strong>
          </Text>
        </>
      )}
    </TransactionalLayout>
  );
}

export default InvoiceSentEmail;
