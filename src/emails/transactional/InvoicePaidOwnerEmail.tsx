import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";
import { InvoiceSummary } from "../components/InvoiceSummary";

export interface InvoicePaidOwnerEmailProps {
  firstName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  invoiceNumber: string;
  clientName: string;
  amountPaid: string;
  paidAt: string;
  viewUrl: string;
}

export function InvoicePaidOwnerEmail({
  firstName,
  orgName,
  logoUrl,
  accentColor = "#111827",
  invoiceNumber,
  clientName,
  amountPaid,
  paidAt,
  viewUrl,
}: InvoicePaidOwnerEmailProps) {
  return (
    <TransactionalLayout
      preview={`${clientName} paid invoice ${invoiceNumber} — ${amountPaid} received.`}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Payment received
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        Hi {firstName},
      </Text>
      <EmailCallout variant="success">
        {clientName} paid {amountPaid} for invoice {invoiceNumber}.
      </EmailCallout>
      <InvoiceSummary
        invoiceNumber={invoiceNumber}
        issueDate={paidAt}
        total={amountPaid}
        accentColor={accentColor}
      />
      <EmailButton href={viewUrl} accentColor={accentColor}>
        View invoice
      </EmailButton>
    </TransactionalLayout>
  );
}

export default InvoicePaidOwnerEmail;
