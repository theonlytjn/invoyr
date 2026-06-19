import { Heading, Text } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";

export interface WinBackEmailProps {
  firstName: string;
  ctaUrl: string;
  unsubscribeUrl: string;
  variant?: "day0" | "day3" | "day7";
}

const CONTENT = {
  day0: {
    preview: "We saved your Invoyr workspace.",
    heading: "We saved your workspace",
    body: "Your Invoyr workspace is still here. All your clients, invoices and payment history are ready and waiting whenever you come back.",
    cta: "Return to Invoyr",
  },
  day3: {
    preview: "Here's what you can still do with Invoyr.",
    heading: "What you can still do with Invoyr",
    body: "Create and send professional invoices, accept card payments, track what's outstanding and get paid faster — all in one place. Your workspace is saved.",
    cta: "Pick up where you left off",
  },
  day7: {
    preview: "A special offer, just for you.",
    heading: "Come back — we'll make it worth it",
    body: "We'd love to have you back. Upgrade now and get your first month free on any paid plan. Your data is still safe, your clients are still there.",
    cta: "Claim your offer",
  },
} as const;

export function WinBackEmail({
  firstName,
  ctaUrl,
  unsubscribeUrl,
  variant = "day0",
}: WinBackEmailProps) {
  const content = CONTENT[variant];

  return (
    <MarketingLayout preview={content.preview} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        {content.heading}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 24px" }}>
        {content.body}
      </Text>
      <EmailButton href={ctaUrl}>{content.cta}</EmailButton>
    </MarketingLayout>
  );
}

export default WinBackEmail;
