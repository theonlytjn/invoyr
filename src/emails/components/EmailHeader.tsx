import { Section, Img, Text } from "@react-email/components";
import { BRAND } from "@/config/brand";
import { EMAIL_COLORS } from "../theme";

interface Props {
  /** The sending organisation. Omit for emails Invoyr sends itself. */
  orgName?: string;
  logoUrl?: string | null;
  accentColor?: string;
}

/**
 * Two modes:
 * - Invoyr's own emails (no orgName): the Invoyr banner (wordmark and tagline
 *   on a navy-tinted hero photo, lime rule beneath).
 * - Emails sent on behalf of an organisation (invoices, reminders, estimates):
 *   the organisation's logo or name, ruled in its own brand colour.
 */
export function EmailHeader({ orgName, logoUrl, accentColor }: Props) {
  if (!orgName) {
    // Navy behind the banner so the alt text still reads on-brand when the
    // client blocks images.
    return (
      <Section style={{ backgroundColor: EMAIL_COLORS.ink }}>
        <Img
          src={BRAND.emailBannerUrl}
          alt={BRAND.emailBannerAlt}
          width={560}
          height={160}
          style={{
            display: "block",
            width: "100%",
            maxWidth: 560,
            height: "auto",
            border: 0,
            color: EMAIL_COLORS.surface,
            fontSize: 18,
            fontWeight: 700,
          }}
        />
      </Section>
    );
  }

  return (
    <Section
      style={{
        backgroundColor: EMAIL_COLORS.surface,
        borderTop: `4px solid ${accentColor ?? EMAIL_COLORS.ink}`,
        borderBottom: `1px solid ${EMAIL_COLORS.border}`,
        padding: "24px 32px 20px",
      }}
    >
      {logoUrl ? (
        <Img
          src={logoUrl}
          alt={orgName}
          height={36}
          style={{ objectFit: "contain", maxWidth: 160, display: "block", border: 0 }}
        />
      ) : (
        <Text
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: EMAIL_COLORS.ink,
            margin: 0,
            lineHeight: "1.2",
            letterSpacing: "-0.01em",
          }}
        >
          {orgName}
        </Text>
      )}
    </Section>
  );
}
