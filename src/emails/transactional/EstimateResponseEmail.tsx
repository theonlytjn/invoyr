import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";
import { InvoiceSummary } from "../components/InvoiceSummary";

export interface EstimateResponseEmailProps {
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  estimateNumber: string;
  clientName: string;
  estimateTotal: string;
  issueDate?: string;
  response: "approved" | "rejected";
  viewUrl: string;
}

export function EstimateResponseEmail({
  orgName,
  logoUrl,
  accentColor = "#111827",
  estimateNumber,
  clientName,
  estimateTotal,
  issueDate,
  response,
  viewUrl,
}: EstimateResponseEmailProps) {
  const approved = response === "approved";

  return (
    <TransactionalLayout
      preview={approved
        ? `${clientName} approved estimate ${estimateNumber}.`
        : `${clientName} declined estimate ${estimateNumber}.`}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Estimate {approved ? "approved" : "declined"}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        {approved
          ? `${clientName} has approved estimate ${estimateNumber}. You can now convert it to an invoice.`
          : `${clientName} has declined estimate ${estimateNumber}.`}
      </Text>

      <EmailCallout variant={approved ? "success" : "error"}>
        {approved
          ? `${estimateNumber} · ${estimateTotal} · Approved by ${clientName}`
          : `${estimateNumber} · ${estimateTotal} · Declined by ${clientName}`}
      </EmailCallout>

      <InvoiceSummary
        invoiceNumber={estimateNumber}
        issueDate={issueDate}
        total={estimateTotal}
        accentColor={accentColor}
      />

      <EmailButton href={viewUrl} accentColor={accentColor}>
        {approved ? "Convert to invoice" : "View estimate"}
      </EmailButton>
    </TransactionalLayout>
  );
}

export default EstimateResponseEmail;
