import { Heading, Text } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";

export interface SubscriptionActivatedEmailProps {
  firstName: string;
  planName: string;
  ctaUrl: string;
}

export function SubscriptionActivatedEmail({ firstName, planName, ctaUrl }: SubscriptionActivatedEmailProps) {
  return (
    <MarketingLayout preview={`You're now on the ${planName} plan — let's get started.`}>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        You're on {planName}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        Your {planName} subscription is now active. Here's what you've unlocked:
      </Text>
      <EmailCallout variant="success">
        Unlimited invoices · Custom branding · Overdue reminders · Estimates & quotes · Priority support
      </EmailCallout>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "20px 0 0" }}>
        Head to your dashboard to make the most of your workspace.
      </Text>
      <EmailButton href={ctaUrl}>Go to my dashboard</EmailButton>
    </MarketingLayout>
  );
}

export default SubscriptionActivatedEmail;
