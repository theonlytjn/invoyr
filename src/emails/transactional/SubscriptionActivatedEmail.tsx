import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EmailCallout } from "../components/EmailCallout";
import { EMAIL_COLORS } from "../theme";
import { SUBSCRIPTION_ACTIVATED_COPY as COPY } from "@/config/email-copy";

export interface SubscriptionActivatedEmailProps {
  firstName: string;
  planName: string;
  /** The plan's highlights from src/config/plans.ts, so the list matches what was bought. */
  highlights: readonly string[];
  ctaUrl: string;
}

const body = { fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6" };

export function SubscriptionActivatedEmail({ firstName, planName, highlights, ctaUrl }: SubscriptionActivatedEmailProps) {
  return (
    <TransactionalLayout preview={COPY.preview(planName)}>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 8px" }}>
        {COPY.heading(planName)}
      </Heading>
      <Text style={{ ...body, margin: "0 0 16px" }}>Hi {firstName},</Text>
      {highlights.length > 0 ? (
        <>
          <Text style={{ ...body, margin: "0 0 20px" }}>{COPY.intro(planName)}</Text>
          <EmailCallout variant="success">{highlights.join(" · ")}</EmailCallout>
        </>
      ) : null}
      <Text style={{ ...body, margin: "20px 0 0" }}>{COPY.outro}</Text>
      <EmailButton href={ctaUrl}>{COPY.cta}</EmailButton>
    </TransactionalLayout>
  );
}

export default SubscriptionActivatedEmail;
