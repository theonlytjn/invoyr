import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Organisation, Client, Invoice } from "@/lib/supabase/types";

const STATUS_LABEL: Record<string, string> = {
  issued: "Issued",
  sent: "Sent",
  overdue: "Overdue",
  paid: "Paid",
  partial: "Partial",
};

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 48, color: "#111827", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  logo: { height: 36, objectFit: "contain", marginBottom: 6 },
  orgName: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  orgDetail: { color: "#6b7280", fontSize: 8, marginBottom: 2 },
  docLabel: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  docDate: { fontSize: 9, color: "#6b7280", textAlign: "right", marginTop: 4 },
  billTo: { backgroundColor: "#f9fafb", padding: 12, borderRadius: 6, marginBottom: 24 },
  sectionLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
  clientName: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 },
  clientDetail: { color: "#6b7280", fontSize: 8, marginBottom: 2 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 5, marginBottom: 2 },
  tableHeaderCell: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#6b7280", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6", paddingVertical: 6 },
  tableCell: { fontSize: 9 },
  colNum: { width: 70 },
  colDate: { width: 60 },
  colDue: { width: 60 },
  colStatus: { width: 55 },
  colTotal: { flex: 1, textAlign: "right" },
  colPaid: { flex: 1, textAlign: "right" },
  colBalance: { flex: 1, textAlign: "right" },
  summary: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  summaryBox: { width: 220, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  summaryLabel: { color: "#6b7280" },
  summaryValue: { fontFamily: "Helvetica-Bold" },
  outstandingRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#111827" },
  outstandingLabel: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  outstandingValue: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 40, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#f3f4f6" },
  footerText: { fontSize: 7, color: "#9ca3af" },
});

interface Props {
  org: Organisation & { logoDataUrl?: string | null };
  client: Client;
  invoices: Invoice[];
  statementDate: string;
  currency: string;
}

export default function ClientStatementPdf({ org, client, invoices, statementDate, currency }: Props) {
  const accent = org.accent_color ?? "#111827";
  const logoSrc = org.logoDataUrl ?? org.logo_url;

  const totalBilled = invoices.reduce((s, i) => s + i.total + (i.late_fee_amount ?? 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + i.amount_paid, 0);
  const outstanding = totalBilled - totalPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
            <Text style={styles.orgName}>{org.name}</Text>
            {org.address_line1 ? <Text style={styles.orgDetail}>{org.address_line1}</Text> : null}
            {org.city ? <Text style={styles.orgDetail}>{org.city}{org.postcode ? `, ${org.postcode}` : ""}</Text> : null}
            {org.email ? <Text style={styles.orgDetail}>{org.email}</Text> : null}
            {org.vat_number ? <Text style={styles.orgDetail}>VAT: {org.vat_number}</Text> : null}
          </View>
          <View>
            <Text style={styles.docLabel}>Statement</Text>
            <Text style={styles.docDate}>Prepared: {statementDate}</Text>
            {org.email ? null : null}
          </View>
        </View>

        {/* Client */}
        <View style={styles.billTo}>
          <Text style={styles.sectionLabel}>Prepared for</Text>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.company_name ? <Text style={styles.clientDetail}>{client.company_name}</Text> : null}
          {client.email ? <Text style={styles.clientDetail}>{client.email}</Text> : null}
          {client.address_line1 ? <Text style={styles.clientDetail}>{client.address_line1}</Text> : null}
          {client.city ? <Text style={styles.clientDetail}>{client.city}{client.postcode ? `, ${client.postcode}` : ""}</Text> : null}
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colNum]}>Invoice #</Text>
          <Text style={[styles.tableHeaderCell, styles.colDate]}>Issued</Text>
          <Text style={[styles.tableHeaderCell, styles.colDue]}>Due</Text>
          <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
          <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          <Text style={[styles.tableHeaderCell, styles.colPaid]}>Paid</Text>
          <Text style={[styles.tableHeaderCell, styles.colBalance]}>Balance</Text>
        </View>

        {invoices.map((inv) => {
          const fee = inv.late_fee_amount ?? 0;
          const invTotal = inv.total + fee;
          const balance = invTotal - inv.amount_paid;
          const isOverdue = inv.status === "overdue";
          return (
            <View key={inv.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNum]}>{inv.invoice_number}</Text>
              <Text style={[styles.tableCell, styles.colDate]}>{formatDate(inv.issue_date)}</Text>
              <Text style={[styles.tableCell, styles.colDue, isOverdue ? { color: "#dc2626" } : {}]}>
                {inv.due_date ? formatDate(inv.due_date) : "—"}
              </Text>
              <Text style={[styles.tableCell, styles.colStatus, isOverdue ? { color: "#dc2626" } : {}]}>
                {STATUS_LABEL[inv.status] ?? inv.status}
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(invTotal, currency)}</Text>
              <Text style={[styles.tableCell, styles.colPaid]}>{formatCurrency(inv.amount_paid, currency)}</Text>
              <Text style={[styles.tableCell, styles.colBalance, balance > 0 ? { fontFamily: "Helvetica-Bold", color: accent } : { color: "#16a34a" }]}>
                {formatCurrency(balance, currency)}
              </Text>
            </View>
          );
        })}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total billed</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalBilled, currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total paid</Text>
              <Text style={[styles.summaryValue, { color: "#16a34a" }]}>{formatCurrency(totalPaid, currency)}</Text>
            </View>
            <View style={[styles.outstandingRow, { borderTopColor: accent }]}>
              <Text style={styles.outstandingLabel}>Outstanding</Text>
              <Text style={[styles.outstandingValue, { color: outstanding > 0 ? accent : "#16a34a" }]}>
                {formatCurrency(outstanding, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Statement of account for {client.company_name ?? client.name}
          </Text>
          <Text style={styles.footerText}>Powered by invoyr</Text>
        </View>
      </Page>
    </Document>
  );
}
