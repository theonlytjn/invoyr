import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { TRIAL_EMAIL_COPY } from "@/config/email-copy";

export interface TrialEndingEmailProps {
  firstName: string;
  ctaUrl: string;
  /** Whole days until the trial ends; 1 means "tomorrow". */
  daysLeft: number;
  /** Formatted end date, e.g. "3 October". */
  endsOn: string;
  /** True when a card is on file and Stripe will charge it automatically. */
  willBeCharged: boolean;
  orgName?: string;
  logoUrl?: string | null;
  accentColor?: string;
}

export function TrialEndingEmail({
  firstName,
  ctaUrl,
  daysLeft,
  endsOn,
  willBeCharged,
  orgName = "Invoyr",
  logoUrl,
  accentColor = "#111827",
}: TrialEndingEmailProps) {
  return (
    // Transactional, not marketing: this is a billing notice about an account
    // that is about to be charged or locked, so it must not depend on consent.
    <TransactionalLayout
      preview={TRIAL_EMAIL_COPY.preview}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        {TRIAL_EMAIL_COPY.heading(daysLeft)}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: 0 }}>
        {TRIAL_EMAIL_COPY.body(daysLeft, endsOn, willBeCharged)}
      </Text>
      <EmailButton href={ctaUrl} accentColor={accentColor}>
        {TRIAL_EMAIL_COPY.cta(willBeCharged)}
      </EmailButton>
    </TransactionalLayout>
  );
}

export default TrialEndingEmail;
