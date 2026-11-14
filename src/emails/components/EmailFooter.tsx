import { Section, Text, Link, Img } from "@react-email/components";
import { LEGAL_ENTITY } from "@/config/legal";
import { BRAND } from "@/config/brand";
import { EMAIL_COLORS } from "../theme";

interface Props {
  unsubscribeUrl?: string;
}

const FOOTER_LOGO_HEIGHT = 16;

const fineprint = {
  fontSize: 11,
  lineHeight: "1.5",
  color: EMAIL_COLORS.subtle,
  margin: "0 0 4px",
  textAlign: "center" as const,
};

export function EmailFooter({ unsubscribeUrl }: Props) {
  return (
    <Section
      style={{
        padding: "24px 32px 28px",
        backgroundColor: EMAIL_COLORS.panel,
        borderTop: `1px solid ${EMAIL_COLORS.border}`,
      }}
    >
      <Text style={{ ...fineprint, fontSize: 12, color: EMAIL_COLORS.muted, margin: "0 0 8px" }}>
        Sent with
      </Text>
      <Link href={BRAND.url} style={{ display: "block", textAlign: "center", margin: "0 0 12px" }}>
        <Img
          src={BRAND.emailLogoUrl}
          alt={BRAND.name}
          width={Math.round(FOOTER_LOGO_HEIGHT * BRAND.logoAspectRatio)}
          height={FOOTER_LOGO_HEIGHT}
          style={{ display: "inline-block", border: 0 }}
        />
      </Link>
      {/* CAN-SPAM requires a valid physical postal address in commercial email,
          and identifying the sender is good practice in transactional mail too. */}
      <Text style={fineprint}>
        {LEGAL_ENTITY.name}, {LEGAL_ENTITY.address}
      </Text>
      <Text style={{ ...fineprint, margin: 0 }}>
        <Link href={BRAND.url} style={{ color: EMAIL_COLORS.muted, textDecoration: "underline" }}>
          invoyr.io
        </Link>
        {" · "}
        <Link
          href={`mailto:${BRAND.supportEmail}`}
          style={{ color: EMAIL_COLORS.muted, textDecoration: "underline" }}
        >
          {BRAND.supportEmail}
        </Link>
        {unsubscribeUrl && (
          <>
            {" · "}
            <Link
              href={unsubscribeUrl}
              style={{ color: EMAIL_COLORS.muted, textDecoration: "underline" }}
            >
              Unsubscribe
            </Link>
          </>
        )}
      </Text>
    </Section>
  );
}
