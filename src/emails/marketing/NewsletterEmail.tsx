import { Heading, Text, Hr } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";

export interface NewsletterEmailProps {
  firstName: string;
  subject: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
}

export function NewsletterEmail({
  firstName,
  subject,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <MarketingLayout preview={subject} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        {subject}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {ctaLabel && ctaUrl && (
        <>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <EmailButton href={ctaUrl}>{ctaLabel}</EmailButton>
        </>
      )}
    </MarketingLayout>
  );
}

export default NewsletterEmail;
