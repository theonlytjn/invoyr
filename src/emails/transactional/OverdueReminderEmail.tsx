import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";
import { InvoiceSummary } from "../components/InvoiceSummary";

export interface OverdueReminderEmailProps {
  clientName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  invoiceNumber: string;
  dueDate: string;
  balanceDue: string;
  payUrl: string;
}

export function OverdueReminderEmail({
  clientName,
  orgName,
  logoUrl,
  accentColor = "#111827",
  invoiceNumber,
  dueDate,
  balanceDue,
  payUrl,
}: OverdueReminderEmailProps) {
  return (
    <TransactionalLayout
      preview="This invoice is now overdue."
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: "#dc2626", margin: "0 0 4px" }}
      >
        Overdue invoice {invoiceNumber}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        Hi {clientName},
      </Text>
      <EmailCallout variant="error">
        Invoice {invoiceNumber} from {orgName} is now overdue.
      </EmailCallout>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "20px 0 4px" }}>
        Please use the secure link below to view and pay the invoice.
      </Text>

      <InvoiceSummary
        invoiceNumber={invoiceNumber}
        dueDate={dueDate}
        total={balanceDue}
        balanceDue={balanceDue}
        accentColor="#dc2626"
      />

      <EmailButton href={payUrl} accentColor={accentColor}>
        Pay overdue invoice
      </EmailButton>
    </TransactionalLayout>
  );
}

export default OverdueReminderEmail;
