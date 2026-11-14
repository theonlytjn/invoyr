import { Section, Img, Text } from "@react-email/components";
import { BRAND } from "@/config/brand";
import { EMAIL_COLORS } from "../theme";

interface Props {
  /** The sending organisation. Omit for emails Invoyr sends itself. */
  orgName?: string;
  logoUrl?: string | null;
  accentColor?: string;
}

const LOGO_HEIGHT = 32;

/**
 * Two modes:
 * - Invoyr's own emails (no orgName): the Invoyr wordmark on white with a lime
 *   rule across the top of the card.
 * - Emails sent on behalf of an organisation (invoices, reminders, estimates):
 *   the organisation's logo or name, ruled in its own brand colour.
 */
export function EmailHeader({ orgName, logoUrl, accentColor }: Props) {
  const isInvoyr = !orgName;
  const rule = isInvoyr ? EMAIL_COLORS.brand : (accentColor ?? EMAIL_COLORS.ink);

  return (
    <Section
      style={{
        backgroundColor: EMAIL_COLORS.surface,
        borderTop: `4px solid ${rule}`,
        borderBottom: `1px solid ${EMAIL_COLORS.border}`,
        padding: "24px 32px 20px",
      }}
    >
      {isInvoyr ? (
        <Img
          src={BRAND.emailLogoUrl}
          alt={BRAND.name}
          width={Math.round(LOGO_HEIGHT * BRAND.logoAspectRatio)}
          height={LOGO_HEIGHT}
          style={{ display: "block", border: 0 }}
        />
      ) : logoUrl ? (
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
