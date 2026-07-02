import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";

export interface AutomationEmailProps {
  recipientName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  subject: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

export function AutomationEmail({
  recipientName,
  orgName,
  logoUrl,
  accentColor = "#111827",
  subject,
  body,
  ctaUrl,
  ctaLabel,
}: AutomationEmailProps) {
  return (
    <TransactionalLayout
      preview={subject}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
        {subject}
      </Heading>
      {body.split("\n").map((line, i) => (
        <Text key={i} style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 8px" }}>
          {line.replace(/\{\{recipient_name\}\}/g, recipientName)}
        </Text>
      ))}
      {ctaUrl && ctaLabel && (
        <EmailButton href={ctaUrl} accentColor={accentColor}>
          {ctaLabel}
        </EmailButton>
      )}
    </TransactionalLayout>
  );
}
