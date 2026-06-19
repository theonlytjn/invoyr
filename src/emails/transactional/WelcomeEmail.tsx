import { Heading, Text } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";

export interface WelcomeEmailProps {
  firstName: string;
  ctaUrl: string;
}

export function WelcomeEmail({ firstName, ctaUrl }: WelcomeEmailProps) {
  return (
    <MarketingLayout preview="Your invoicing workspace is ready.">
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}
      >
        Welcome to Invoyr
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Welcome to Invoyr — your new workspace for creating invoices, managing clients and
        getting paid faster.
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: 0 }}>
        Start by adding your business details, uploading your logo and creating your first client.
      </Text>
      <EmailButton href={ctaUrl}>Set up my workspace</EmailButton>
    </MarketingLayout>
  );
}

export default WelcomeEmail;
