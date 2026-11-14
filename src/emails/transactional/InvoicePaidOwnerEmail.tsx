import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";
import { InvoiceSummary } from "../components/InvoiceSummary";
import { EMAIL_COLORS } from "../theme";

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
  accentColor = EMAIL_COLORS.ink,
  invoiceNumber,
  clientName,
  amountPaid,
  paidAt,
  viewUrl,
}: InvoicePaidOwnerEmailProps) {
  return (
    <TransactionalLayout
      preview={`${clientName} paid invoice ${invoiceNumber} — ${amountPaid} received.`}
    >
      <Heading style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 4px" }}>
        Payment received
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
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
