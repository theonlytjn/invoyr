import { Heading, Text, Hr } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { InvoiceSummary } from "../components/InvoiceSummary";
import { EMAIL_COLORS } from "../theme";

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
}: InvoiceSentEmailProps) {
  const hasBankDetails =
    bankDetails?.accountName || bankDetails?.accountNumber;

  return (
    <TransactionalLayout
      preview={`${orgName} has sent you an invoice for ${invoiceTotal}.`}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 4px" }}
      >
        Invoice {invoiceNumber}
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
        Hi {clientName},
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
        {orgName} has sent you invoice {invoiceNumber} for {invoiceTotal}.
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 4px" }}>
        You can view the invoice, download a PDF and pay securely using the link below.
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
        View and pay invoice
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
            Or pay by bank transfer
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
            Reference: <strong style={{ color: EMAIL_COLORS.muted }}>{invoiceNumber}</strong>
          </Text>
        </>
      )}
    </TransactionalLayout>
  );
}

export default InvoiceSentEmail;
