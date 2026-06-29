import { Heading, Text, Row, Column, Section } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { formatCurrency } from "@/lib/utils";

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
  paid: "#16a34a",
  overdue: "#dc2626",
  partial: "#d97706",
};

export function ClientStatementEmail({
  orgName,
  logoUrl,
  accentColor = "#111827",
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
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Statement of account
      </Heading>
      <Text style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px" }}>
        Prepared for {clientName} · {statementDate}
      </Text>

      {/* Invoice table */}
      <Section style={{ marginBottom: 24 }}>
        {/* Header */}
        <Row style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 6, marginBottom: 4 }}>
          <Column style={{ width: "25%", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Invoice</Column>
          <Column style={{ width: "20%", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Issued</Column>
          <Column style={{ width: "20%", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Status</Column>
          <Column style={{ width: "17%", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Total</Column>
          <Column style={{ width: "18%", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Balance</Column>
        </Row>

        {invoices.map((inv) => (
          <Row key={inv.invoiceNumber} style={{ borderBottom: "1px solid #f3f4f6", paddingTop: 8, paddingBottom: 8 }}>
            <Column style={{ width: "25%", fontSize: 13, fontWeight: 600, color: "#111827" }}>{inv.invoiceNumber}</Column>
            <Column style={{ width: "20%", fontSize: 13, color: "#6b7280" }}>{inv.issueDate}</Column>
            <Column style={{ width: "20%", fontSize: 13, color: STATUS_COLOR[inv.status] ?? "#374151", fontWeight: inv.status === "overdue" ? 600 : 400 }}>
              {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
            </Column>
            <Column style={{ width: "17%", fontSize: 13, color: "#374151", textAlign: "right" }}>{formatCurrency(inv.total, currency)}</Column>
            <Column style={{ width: "18%", fontSize: 13, fontWeight: 700, color: inv.balance > 0 ? accentColor : "#16a34a", textAlign: "right" }}>
              {formatCurrency(inv.balance, currency)}
            </Column>
          </Row>
        ))}
      </Section>

      {/* Summary */}
      <Section style={{ backgroundColor: "#f9fafb", borderRadius: 8, padding: "16px 20px", marginBottom: 8 }}>
        <Row style={{ marginBottom: 6 }}>
          <Column style={{ fontSize: 13, color: "#6b7280" }}>Total billed</Column>
          <Column style={{ fontSize: 13, fontWeight: 700, color: "#111827", textAlign: "right" }}>{formatCurrency(totalBilled, currency)}</Column>
        </Row>
        <Row style={{ marginBottom: 6 }}>
          <Column style={{ fontSize: 13, color: "#6b7280" }}>Total paid</Column>
          <Column style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", textAlign: "right" }}>{formatCurrency(totalPaid, currency)}</Column>
        </Row>
        <Row style={{ borderTop: "1px solid #e5e7eb", paddingTop: 8, marginTop: 4 }}>
          <Column style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Outstanding</Column>
          <Column style={{ fontSize: 14, fontWeight: 700, color: outstanding > 0 ? accentColor : "#16a34a", textAlign: "right" }}>
            {formatCurrency(outstanding, currency)}
          </Column>
        </Row>
      </Section>

      <Text style={{ fontSize: 12, color: "#9ca3af", margin: "16px 0 0", textAlign: "center" }}>
        This statement is for your records. Please contact us if you have any questions.
      </Text>
    </TransactionalLayout>
  );
}

export default ClientStatementEmail;
