import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { InvoiceSummary } from "../components/InvoiceSummary";

export interface PaymentReminderEmailProps {
  clientName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  invoiceNumber: string;
  dueDate: string;
  balanceDue: string;
  payUrl: string;
}

export function PaymentReminderEmail({
  clientName,
  orgName,
  logoUrl,
  accentColor = "#111827",
  invoiceNumber,
  dueDate,
  balanceDue,
  payUrl,
}: PaymentReminderEmailProps) {
  return (
    <TransactionalLayout
      preview="A quick reminder about your outstanding invoice."
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}
      >
        Reminder: invoice {invoiceNumber}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        Hi {clientName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        This is a quick reminder that invoice {invoiceNumber} from {orgName} is due {dueDate}.
      </Text>

      <InvoiceSummary
        invoiceNumber={invoiceNumber}
        dueDate={dueDate}
        total={balanceDue}
        balanceDue={balanceDue}
        accentColor={accentColor}
      />

      <EmailButton href={payUrl} accentColor={accentColor}>
        View and pay invoice
      </EmailButton>
    </TransactionalLayout>
  );
}

export default PaymentReminderEmail;
