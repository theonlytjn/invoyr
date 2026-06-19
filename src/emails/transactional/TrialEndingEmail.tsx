import { Heading, Text } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";

export interface TrialEndingEmailProps {
  firstName: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export function TrialEndingEmail({ firstName, ctaUrl, unsubscribeUrl }: TrialEndingEmailProps) {
  return (
    <MarketingLayout
      preview="Choose a plan to keep your workspace active."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}
      >
        Your Invoyr trial ends soon
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: 0 }}>
        Your Invoyr trial is ending soon. Choose a plan to keep creating invoices, managing
        clients and collecting payments without interruption.
      </Text>
      <EmailButton href={ctaUrl}>Choose my plan</EmailButton>
    </MarketingLayout>
  );
}

export default TrialEndingEmail;
