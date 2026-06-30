import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";

export interface CreditNoteEmailProps {
  clientName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  creditNoteNumber: string;
  amount: string;
  reason?: string | null;
  invoiceNumber: string;
  payUrl?: string;
}

export function CreditNoteEmail({
  clientName,
  orgName,
  logoUrl,
  accentColor = "#111827",
  creditNoteNumber,
  amount,
  reason,
  invoiceNumber,
  payUrl,
}: CreditNoteEmailProps) {
  return (
    <TransactionalLayout
      preview={`A credit of ${amount} has been applied to invoice ${invoiceNumber}.`}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}
      >
        Credit note {creditNoteNumber}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        Hi {clientName},
      </Text>
      <EmailCallout variant="info">
        A credit of <strong>{amount}</strong> has been applied to invoice{" "}
        {invoiceNumber}.{reason ? ` Reason: ${reason}` : ""}
      </EmailCallout>
      {payUrl && (
        <>
          <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "20px 0 0" }}>
            You can view your updated invoice balance using the link below.
          </Text>
          <EmailButton href={payUrl} accentColor={accentColor}>
            View invoice
          </EmailButton>
        </>
      )}
    </TransactionalLayout>
  );
}

export default CreditNoteEmail;
