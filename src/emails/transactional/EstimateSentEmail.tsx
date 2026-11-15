import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { InvoiceSummary } from "../components/InvoiceSummary";
import { EMAIL_COLORS } from "../theme";

export interface EstimateSentEmailProps {
  clientName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  estimateNumber: string;
  estimateTotal: string;
  issueDate?: string;
  expiryDate?: string;
  viewUrl: string;
}

export function EstimateSentEmail({
  clientName,
  orgName,
  logoUrl,
  accentColor = EMAIL_COLORS.ink,
  estimateNumber,
  estimateTotal,
  issueDate,
  expiryDate,
  viewUrl,
}: EstimateSentEmailProps) {
  return (
    <TransactionalLayout
      preview={`${orgName} has sent you an estimate for ${estimateTotal}.`}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 4px" }}
      >
        Estimate {estimateNumber}
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
        Hi {clientName},
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
        {orgName} has sent you estimate {estimateNumber} for {estimateTotal}.
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 4px" }}>
        Please review the estimate using the link below. You can approve or decline it directly from the page.
      </Text>

      <InvoiceSummary
        invoiceNumber={estimateNumber}
        issueDate={issueDate}
        dueDate={expiryDate}
        total={estimateTotal}
        kind="estimate"
        accentColor={accentColor}
      />

      <EmailButton href={viewUrl} accentColor={accentColor}>
        Review estimate
      </EmailButton>
    </TransactionalLayout>
  );
}

export default EstimateSentEmail;
