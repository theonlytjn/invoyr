import { Heading, Text, Hr } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";

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
    <MarketingLayout preview={`What's new in Invoyr: ${updateTitle}`} unsubscribeUrl={unsubscribeUrl}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 8px",
        }}
      >
        Product update
      </Text>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        {updateTitle}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        {updateSummary}
      </Text>
      {features.length > 0 && (
        <>
          <Text style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
            What&apos;s new:
          </Text>
          {features.map((f, i) => (
            <Text
              key={i}
              style={{ fontSize: 14, color: "#374151", lineHeight: "1.6", margin: "0 0 4px", paddingLeft: 16 }}
            >
              · {f}
            </Text>
          ))}
        </>
      )}
      <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
      <EmailButton href={ctaUrl}>Open Invoyr</EmailButton>
    </MarketingLayout>
  );
}

export default ProductUpdateEmail;
