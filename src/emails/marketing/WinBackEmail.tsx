import { Heading, Text } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";
import { EMAIL_COLORS } from "../theme";
import { WIN_BACK_COPY } from "@/config/email-copy";

export interface WinBackEmailProps {
  firstName: string;
  ctaUrl: string;
  unsubscribeUrl: string;
  variant?: "day0" | "day3" | "day7";
}


export function WinBackEmail({
  firstName,
  ctaUrl,
  unsubscribeUrl,
  variant = "day0",
}: WinBackEmailProps) {
  const content = WIN_BACK_COPY[variant];

  return (
    <MarketingLayout preview={content.preview} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 8px" }}>
        {content.heading}
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 24px" }}>
        {content.body}
      </Text>
      <EmailButton href={ctaUrl}>{content.cta}</EmailButton>
    </MarketingLayout>
  );
}

export default WinBackEmail;
