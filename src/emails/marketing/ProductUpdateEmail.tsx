import { Heading, Text, Hr } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";
import { EMAIL_COLORS } from "../theme";
import { PRODUCT_UPDATE_COPY as COPY } from "@/config/email-copy";

export interface ProductUpdateEmailProps {
  firstName: string;
  updateTitle: string;
  updateSummary: string;
  features: string[];
  ctaUrl: string;
  unsubscribeUrl: string;
}

export function ProductUpdateEmail({
  firstName,
  updateTitle,
  updateSummary,
  features,
  ctaUrl,
  unsubscribeUrl,
}: ProductUpdateEmailProps) {
  return (
    <MarketingLayout preview={COPY.preview(updateTitle)} unsubscribeUrl={unsubscribeUrl}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: EMAIL_COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 8px",
        }}
      >
        {COPY.kicker}
      </Text>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 8px" }}>
        {updateTitle}
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 20px" }}>
        {updateSummary}
      </Text>
      {features.length > 0 && (
        <>
          <Text style={{ fontSize: 13, fontWeight: 600, color: EMAIL_COLORS.ink, margin: "0 0 8px" }}>
            {COPY.featuresHeading}
          </Text>
          {features.map((f, i) => (
            <Text
              key={i}
              style={{ fontSize: 14, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 4px", paddingLeft: 16 }}
            >
              · {f}
            </Text>
          ))}
        </>
      )}
      <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "24px 0" }} />
      <EmailButton href={ctaUrl}>{COPY.cta}</EmailButton>
    </MarketingLayout>
  );
}

export default ProductUpdateEmail;
