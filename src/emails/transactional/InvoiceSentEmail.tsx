import { Heading, Text, Hr } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { InvoiceSummary } from "../components/InvoiceSummary";

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
  invoiceTotal: string;
  issueDate?: string;
  dueDate?: string;
  payUrl: string;
  bankDetails?: BankDetails | null;
}

export function InvoiceSentEmail({
  clientName,
  orgName,
  logoUrl,
  accentColor = "#111827",
  invoiceNumber,
  invoiceTotal,
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
        style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}
      >
        Invoice {invoiceNumber}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        Hi {clientName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        {orgName} has sent you invoice {invoiceNumber} for {invoiceTotal}.
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 4px" }}>
        You can view the invoice, download a PDF and pay securely using the link below.
      </Text>

      <InvoiceSummary
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        dueDate={dueDate}
        total={invoiceTotal}
        accentColor={accentColor}
      />

      <EmailButton href={payUrl} accentColor={accentColor}>
        View and pay invoice
      </EmailButton>

      {hasBankDetails && (
        <>
          <Hr style={{ borderColor: "#e5e7eb", margin: "28px 0 20px" }} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9ca3af",
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
                <td style={{ color: "#6b7280", paddingRight: 16, paddingBottom: 4 }}>Account name</td>
                <td style={{ fontWeight: 600, color: "#111827" }}>{bankDetails.accountName}</td>
              </tr>
            )}
            {bankDetails?.bankName && (
              <tr>
                <td style={{ color: "#6b7280", paddingRight: 16, paddingBottom: 4 }}>Bank</td>
                <td style={{ fontWeight: 600, color: "#111827" }}>{bankDetails.bankName}</td>
              </tr>
            )}
            {bankDetails?.accountNumber && (
              <tr>
                <td style={{ color: "#6b7280", paddingRight: 16, paddingBottom: 4 }}>Account number</td>
                <td style={{ fontWeight: 600, color: "#111827" }}>{bankDetails.accountNumber}</td>
              </tr>
            )}
            {bankDetails?.sortCode && (
              <tr>
                <td style={{ color: "#6b7280", paddingRight: 16, paddingBottom: 4 }}>Sort code</td>
                <td style={{ fontWeight: 600, color: "#111827" }}>{bankDetails.sortCode}</td>
              </tr>
            )}
            {bankDetails?.iban && (
              <tr>
                <td style={{ color: "#6b7280", paddingRight: 16, paddingBottom: 4 }}>IBAN</td>
                <td style={{ fontWeight: 600, color: "#111827" }}>{bankDetails.iban}</td>
              </tr>
            )}
            {bankDetails?.bic && (
              <tr>
                <td style={{ color: "#6b7280", paddingRight: 16, paddingBottom: 4 }}>BIC / SWIFT</td>
                <td style={{ fontWeight: 600, color: "#111827" }}>{bankDetails.bic}</td>
              </tr>
            )}
          </table>
          <Text style={{ fontSize: 12, color: "#9ca3af", margin: "8px 0 0" }}>
            Reference: <strong style={{ color: "#6b7280" }}>{invoiceNumber}</strong>
          </Text>
        </>
      )}
    </TransactionalLayout>
  );
}

export default InvoiceSentEmail;
