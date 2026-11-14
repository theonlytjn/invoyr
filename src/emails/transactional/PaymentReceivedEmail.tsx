import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";
import { EMAIL_COLORS } from "../theme";

export interface PaymentReceivedEmailProps {
  clientName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  invoiceNumber: string;
  amountPaid: string;
  receiptUrl?: string;
}

export function PaymentReceivedEmail({
  clientName,
  orgName,
  logoUrl,
  accentColor = EMAIL_COLORS.ink,
  invoiceNumber,
  amountPaid,
  receiptUrl,
}: PaymentReceivedEmailProps) {
  return (
    <TransactionalLayout
      preview={`We've recorded your payment of ${amountPaid}.`}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 4px" }}
      >
        Payment received
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
        Hi {clientName},
      </Text>
      <EmailCallout variant="info">
        Thank you — your payment of {amountPaid} for invoice {invoiceNumber} has been received.
      </EmailCallout>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "20px 0 0" }}>
        You can view your receipt using the link below.
      </Text>
      {receiptUrl && (
        <EmailButton href={receiptUrl} accentColor={accentColor}>
          View receipt
        </EmailButton>
      )}
    </TransactionalLayout>
  );
}

export default PaymentReceivedEmail;
