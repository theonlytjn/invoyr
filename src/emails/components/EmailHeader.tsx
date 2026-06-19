import { Section, Img, Text } from "@react-email/components";

interface Props {
  orgName?: string;
  logoUrl?: string | null;
  accentColor?: string;
}

export function EmailHeader({ orgName, logoUrl, accentColor = "#111827" }: Props) {
  return (
    <Section>
      <div
        style={{
          borderBottom: `3px solid ${accentColor}`,
          padding: "24px 32px 20px",
          backgroundColor: "#ffffff",
        }}
      >
        {logoUrl ? (
          <Img
            src={logoUrl}
            alt={orgName ?? ""}
            height={36}
            style={{ objectFit: "contain", maxWidth: 140, display: "block" }}
          />
        ) : orgName ? (
          <Text
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              lineHeight: "1.2",
            }}
          >
            {orgName}
          </Text>
        ) : (
          <Text
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: accentColor,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            invoyr
          </Text>
        )}
      </div>
    </Section>
  );
}
