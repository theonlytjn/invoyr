import { Heading, Text, Section, Row, Column, Hr } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";

export interface WeeklyDigestEmailProps {
  ownerName: string;
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  outstanding: string;
  overdueCount: number;
  overdueAmount: string;
  collectedLastWeek: string;
  issuedLastWeek: number;
  dashboardUrl: string;
  weekEnding: string;
}

const statBoxStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "16px 20px",
  width: "100%",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: "0 0 4px",
};

const statValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 2px",
  lineHeight: "1.2",
};

const statSubStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  margin: 0,
};

export function WeeklyDigestEmail({
  ownerName,
  orgName,
  logoUrl,
  accentColor = "#111827",
  outstanding,
  overdueCount,
  overdueAmount,
  collectedLastWeek,
  issuedLastWeek,
  dashboardUrl,
  weekEnding,
}: WeeklyDigestEmailProps) {
  return (
    <TransactionalLayout
      preview={`Your week at a glance — ${outstanding} outstanding, ${collectedLastWeek} collected.`}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Your week at a glance
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 24px" }}>
        Hi {ownerName}, here&apos;s your summary for the week ending {weekEnding}.
      </Text>

      {/* Stats grid — row 1 */}
      <Section style={{ marginBottom: 12 }}>
        <Row>
          <Column style={{ width: "50%", paddingRight: 6 }}>
            <div style={statBoxStyle}>
              <p style={statLabelStyle}>Outstanding</p>
              <p style={statValueStyle}>{outstanding}</p>
              <p style={statSubStyle}>across all active invoices</p>
            </div>
          </Column>
          <Column style={{ width: "50%", paddingLeft: 6 }}>
            <div style={{ ...statBoxStyle, borderColor: overdueCount > 0 ? "#fca5a5" : "#e5e7eb", backgroundColor: overdueCount > 0 ? "#fff7f7" : "#f9fafb" }}>
              <p style={{ ...statLabelStyle, color: overdueCount > 0 ? "#b91c1c" : "#6b7280" }}>Overdue</p>
              <p style={{ ...statValueStyle, color: overdueCount > 0 ? "#dc2626" : "#111827" }}>{overdueAmount}</p>
              <p style={statSubStyle}>
                {overdueCount === 0 ? "no overdue invoices" : `${overdueCount} invoice${overdueCount !== 1 ? "s" : ""} overdue`}
              </p>
            </div>
          </Column>
        </Row>
      </Section>

      {/* Stats grid — row 2 */}
      <Section style={{ marginBottom: 24 }}>
        <Row>
          <Column style={{ width: "50%", paddingRight: 6 }}>
            <div style={{ ...statBoxStyle, borderColor: "#a7f3d0", backgroundColor: "#f0fdf4" }}>
              <p style={{ ...statLabelStyle, color: "#065f46" }}>Collected this week</p>
              <p style={{ ...statValueStyle, color: "#059669" }}>{collectedLastWeek}</p>
              <p style={statSubStyle}>payments received</p>
            </div>
          </Column>
          <Column style={{ width: "50%", paddingLeft: 6 }}>
            <div style={statBoxStyle}>
              <p style={statLabelStyle}>Issued this week</p>
              <p style={statValueStyle}>{issuedLastWeek}</p>
              <p style={statSubStyle}>
                {issuedLastWeek === 1 ? "new invoice" : "new invoices"}
              </p>
            </div>
          </Column>
        </Row>
      </Section>

      <Hr style={{ borderColor: "#e5e7eb", margin: "0 0 20px" }} />

      <EmailButton href={dashboardUrl} accentColor={accentColor}>
        View dashboard
      </EmailButton>
    </TransactionalLayout>
  );
}

export default WeeklyDigestEmail;
