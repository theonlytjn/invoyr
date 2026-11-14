import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { TRIAL_EMAIL_COPY, type TrialEmailContext } from "@/config/email-copy";
import { EMAIL_COLORS } from "../theme";

/**
 * Covers the whole trial lifecycle — the reminders before it ends and the
 * notice once it has — because the two differ only in wording, which lives in
 * `config/email-copy`. A second near-identical component would be duplication.
 */
export interface TrialEndingEmailProps extends TrialEmailContext {
  firstName: string;
  ctaUrl: string;
  orgName?: string;
  logoUrl?: string | null;
  accentColor?: string;
}

export function TrialEndingEmail({
  firstName,
  ctaUrl,
  accentColor = EMAIL_COLORS.ink,
  ...context
}: TrialEndingEmailProps) {
  return (
    // Transactional, not marketing: this is a billing notice about an account
    // that is about to be charged or is already locked, so it must not depend
    // on marketing consent.
    <TransactionalLayout
      preview={TRIAL_EMAIL_COPY.preview(context)}
    >
      <Heading style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 8px" }}>
        {TRIAL_EMAIL_COPY.heading(context)}
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: 0 }}>
        {TRIAL_EMAIL_COPY.body(context)}
      </Text>
      {TRIAL_EMAIL_COPY.offer(context) && (
        <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "16px 0 0" }}>
          {TRIAL_EMAIL_COPY.offer(context)}
        </Text>
      )}
      <EmailButton href={ctaUrl} accentColor={accentColor}>
        {TRIAL_EMAIL_COPY.cta(context)}
      </EmailButton>
    </TransactionalLayout>
  );
}

export default TrialEndingEmail;
