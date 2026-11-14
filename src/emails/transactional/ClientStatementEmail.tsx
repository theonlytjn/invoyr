import { Heading, Text, Row, Column, Section } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { formatCurrency } from "@/lib/utils";
import { EMAIL_COLORS } from "../theme";

export interface StatementInvoiceRow {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  status: string;
  total: number;
  amountPaid: number;
  balance: number;
}

export interface ClientStatementEmailProps {
  orgName: string;
  logoUrl?: string | null;
  accentColor?: string;
  clientName: string;
  statementDate: string;
  invoices: StatementInvoiceRow[];
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  currency: string;
}

const STATUS_COLOR: Record<string, string> = {
  paid: EMAIL_COLORS.success,
  overdue: EMAIL_COLORS.danger,
  partial: EMAIL_COLORS.warning,
};

export function ClientStatementEmail({
  orgName,
  logoUrl,
  accentColor = EMAIL_COLORS.ink,
  clientName,
  statementDate,
  invoices,
  totalBilled,
  totalPaid,
  outstanding,
  currency,
}: ClientStatementEmailProps) {
  return (
    <TransactionalLayout
      preview={`Statement of account from ${orgName} — ${formatCurrency(outstanding, currency)} outstanding`}
      orgName={orgName}
      logoUrl={logoUrl}
      accentColor={accentColor}
    >
      <Heading style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 4px" }}>
        Statement of account
      </Heading>
      <Text style={{ fontSize: 14, color: EMAIL_COLORS.muted, margin: "0 0 24px" }}>
        Prepared for {clientName} · {statementDate}
      </Text>

      {/* Invoice table */}
      <Section style={{ marginBottom: 24 }}>
        {/* Header */}
        <Row style={{ borderBottom: `1px solid ${EMAIL_COLORS.border}`, paddingBottom: 6, marginBottom: 4 }}>
          <Column style={{ width: "25%", fontSize: 11, fontWeight: 700, color: EMAIL_COLORS.muted, textTransform: "uppercase" }}>Invoice</Column>
          <Column style={{ width: "20%", fontSize: 11, fontWeight: 700, color: EMAIL_COLORS.muted, textTransform: "uppercase" }}>Issued</Column>
          <Column style={{ width: "20%", fontSize: 11, fontWeight: 700, color: EMAIL_COLORS.muted, textTransform: "uppercase" }}>Status</Column>
          <Column style={{ width: "17%", fontSize: 11, fontWeight: 700, color: EMAIL_COLORS.muted, textTransform: "uppercase", textAlign: "right" }}>Total</Column>
          <Column style={{ width: "18%", fontSize: 11, fontWeight: 700, color: EMAIL_COLORS.muted, textTransform: "uppercase", textAlign: "right" }}>Balance</Column>
        </Row>

        {invoices.map((inv) => (
          <Row key={inv.invoiceNumber} style={{ borderBottom: `1px solid ${EMAIL_COLORS.border}`, paddingTop: 8, paddingBottom: 8 }}>
            <Column style={{ width: "25%", fontSize: 13, fontWeight: 600, color: EMAIL_COLORS.ink }}>{inv.invoiceNumber}</Column>
            <Column style={{ width: "20%", fontSize: 13, color: EMAIL_COLORS.muted }}>{inv.issueDate}</Column>
            <Column style={{ width: "20%", fontSize: 13, color: STATUS_COLOR[inv.status] ?? EMAIL_COLORS.body, fontWeight: inv.status === "overdue" ? 600 : 400 }}>
              {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
            </Column>
            <Column style={{ width: "17%", fontSize: 13, color: EMAIL_COLORS.body, textAlign: "right" }}>{formatCurrency(inv.total, currency)}</Column>
            <Column style={{ width: "18%", fontSize: 13, fontWeight: 700, color: inv.balance > 0 ? accentColor : EMAIL_COLORS.success, textAlign: "right" }}>
              {formatCurrency(inv.balance, currency)}
            </Column>
          </Row>
        ))}
      </Section>

      {/* Summary */}
      <Section style={{ backgroundColor: EMAIL_COLORS.panel, borderRadius: 8, padding: "16px 20px", marginBottom: 8 }}>
        <Row style={{ marginBottom: 6 }}>
          <Column style={{ fontSize: 13, color: EMAIL_COLORS.muted }}>Total billed</Column>
          <Column style={{ fontSize: 13, fontWeight: 700, color: EMAIL_COLORS.ink, textAlign: "right" }}>{formatCurrency(totalBilled, currency)}</Column>
        </Row>
        <Row style={{ marginBottom: 6 }}>
          <Column style={{ fontSize: 13, color: EMAIL_COLORS.muted }}>Total paid</Column>
          <Column style={{ fontSize: 13, fontWeight: 700, color: EMAIL_COLORS.success, textAlign: "right" }}>{formatCurrency(totalPaid, currency)}</Column>
        </Row>
        <Row style={{ borderTop: `1px solid ${EMAIL_COLORS.border}`, paddingTop: 8, marginTop: 4 }}>
          <Column style={{ fontSize: 14, fontWeight: 700, color: EMAIL_COLORS.ink }}>Outstanding</Column>
          <Column style={{ fontSize: 14, fontWeight: 700, color: outstanding > 0 ? accentColor : EMAIL_COLORS.success, textAlign: "right" }}>
            {formatCurrency(outstanding, currency)}
          </Column>
        </Row>
      </Section>

      <Text style={{ fontSize: 12, color: EMAIL_COLORS.subtle, margin: "16px 0 0", textAlign: "center" }}>
        This statement is for your records. Please contact us if you have any questions.
      </Text>
    </TransactionalLayout>
  );
}

export default ClientStatementEmail;
