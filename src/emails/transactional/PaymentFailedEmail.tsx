import { Heading, Text } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";

export interface PaymentFailedEmailProps {
  firstName: string;
  ctaUrl: string;
}

export function PaymentFailedEmail({ firstName, ctaUrl }: PaymentFailedEmailProps) {
  return (
    <MarketingLayout preview="Please update your billing details to keep your account active.">
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}
      >
        Payment failed for your Invoyr subscription
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <EmailCallout variant="error">
        We could not process the latest payment for your Invoyr subscription.
      </EmailCallout>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "16px 0 0" }}>
        Please update your billing details to avoid interruption to your account.
      </Text>
      <EmailButton href={ctaUrl}>Update billing details</EmailButton>
    </MarketingLayout>
  );
}

export default PaymentFailedEmail;
