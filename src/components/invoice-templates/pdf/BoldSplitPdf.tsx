import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceTemplateProps } from "../types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  draft: "DRAFT",
  issued: "UNPAID",
  sent: "AWAITING PAYMENT",
  paid: "PAID",
  overdue: "OVERDUE",
  void: "VOID",
};

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#111827", backgroundColor: "#ffffff" },
  headerBand: { padding: 40, paddingBottom: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orgName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 4 },
  orgDetail: { fontSize: 9, color: "rgba(255,255,255,0.7)", marginBottom: 2 },
  invBig: { fontSize: 36, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.2)", textAlign: "right", lineHeight: 1 },
  invNumber: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "right", marginTop: 4 },
  statusBadge: { marginTop: 16, flexDirection: "row", gap: 8 },
  badge: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  dueText: { fontSize: 8, color: "rgba(255,255,255,0.7)", paddingTop: 3 },
  body: { padding: 40 },
  billTo: { marginBottom: 24 },
  sectionLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  clientName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  clientDetail: { color: "#6b7280", fontSize: 9, marginBottom: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", paddingVertical: 8, paddingHorizontal: 6, borderRadius: 4, marginBottom: 4 },
  tableHeaderCell: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#374151" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6", paddingVertical: 7, paddingHorizontal: 6 },
  tableCell: { fontSize: 9 },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  totalsBlock: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  totalsBox: { width: 200, padding: 16, borderRadius: 8 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalsLabel: { color: "rgba(255,255,255,0.8)", fontSize: 9 },
  totalsValue: { color: "rgba(255,255,255,0.8)", fontSize: 9 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: "rgba(255,255,255,0.3)" },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#ffffff" },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#ffffff" },
  notes: { marginTop: 20, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#f3f4f6" },
  notesText: { color: "#6b7280", fontSize: 9 },
  bankSection: { borderTopWidth: 0.5, borderTopColor: "#f3f4f6", marginTop: 20, paddingTop: 14 },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  bankField: { minWidth: 110, marginBottom: 6 },
  bankLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  bankValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111827" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#f9fafb" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

export default function BoldSplitPdf({ invoice, items, client, org, totals }: InvoiceTemplateProps) {
  const accent = org.accent_color ?? "#111827";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.headerBand, { backgroundColor: accent }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orgName}>{org.name}</Text>
              {org.address_line1 ? <Text style={styles.orgDetail}>{org.address_line1}</Text> : null}
              {org.city ? <Text style={styles.orgDetail}>{org.city}</Text> : null}
            </View>
            <View>
              <Text style={styles.invBig}>INV</Text>
              <Text style={styles.invNumber}>{invoice.invoice_number}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.badge}>{STATUS_LABEL[invoice.status] ?? invoice.status.toUpperCase()}</Text>
            {invoice.due_date ? <Text style={styles.dueText}>Due {formatDate(invoice.due_date)}</Text> : null}
            {invoice.po_number ? <Text style={styles.dueText}>PO: {invoice.po_number}</Text> : null}
          </View>
        </View>

        <View style={styles.body}>
          {client ? (
            <View style={styles.billTo}>
              <Text style={styles.sectionLabel}>Billed to</Text>
              <Text style={styles.clientName}>{client.company_name ?? client.name}</Text>
              {client.email ? <Text style={styles.clientDetail}>{client.email}</Text> : null}
              {client.address_line1 ? <Text style={styles.clientDetail}>{client.address_line1}</Text> : null}
            </View>
          ) : null}

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>VAT</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Total</Text>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{formatCurrency(item.unit_price, invoice.currency)}</Text>
              <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{item.vat_rate}%</Text>
              <Text style={[styles.tableCell, styles.col2, { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatCurrency(item.line_total, invoice.currency)}</Text>
            </View>
          ))}

          <View style={styles.totalsBlock}>
            <View style={[styles.totalsBox, { backgroundColor: accent }]}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>{formatCurrency(totals.subtotal, invoice.currency)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>VAT</Text>
                <Text style={styles.totalsValue}>{formatCurrency(totals.vatAmount, invoice.currency)}</Text>
              </View>
              {(totals.discount ?? 0) > 0 ? (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Discount</Text>
                  <Text style={styles.totalsValue}>−{formatCurrency(totals.discount!, invoice.currency)}</Text>
                </View>
              ) : null}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total due</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.total, invoice.currency)}</Text>
              </View>
              {(totals.lateFeeAmount ?? 0) > 0 ? (
                <View style={[styles.totalsRow, { marginTop: 4 }]}>
                  <Text style={[styles.totalsLabel, { color: "#fed7aa" }]}>Late fee</Text>
                  <Text style={[styles.totalsValue, { color: "#fed7aa" }]}>+{formatCurrency(totals.lateFeeAmount!, invoice.currency)}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {(invoice.notes || invoice.terms || org.default_terms) ? (
            <View style={styles.notes}>
              {invoice.notes ? <Text style={styles.notesText}>{invoice.notes}</Text> : null}
              {(invoice.terms ?? org.default_terms) ? <Text style={[styles.notesText, { marginTop: 4 }]}>{invoice.terms ?? org.default_terms}</Text> : null}
            </View>
          ) : null}

          {(org.bank_account_name || org.bank_account_number) ? (
            <View style={styles.bankSection}>
              <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>Bank transfer details</Text>
              <View style={styles.bankGrid}>
                {org.bank_account_name ? <View style={styles.bankField}><Text style={styles.bankLabel}>Account name</Text><Text style={styles.bankValue}>{org.bank_account_name}</Text></View> : null}
                {org.bank_name ? <View style={styles.bankField}><Text style={styles.bankLabel}>Bank</Text><Text style={styles.bankValue}>{org.bank_name}</Text></View> : null}
                {org.bank_account_number ? <View style={styles.bankField}><Text style={styles.bankLabel}>Account number</Text><Text style={styles.bankValue}>{org.bank_account_number}</Text></View> : null}
                {org.bank_sort_code ? <View style={styles.bankField}><Text style={styles.bankLabel}>Sort code</Text><Text style={styles.bankValue}>{org.bank_sort_code}</Text></View> : null}
                {org.bank_iban ? <View style={[styles.bankField, { minWidth: 220 }]}><Text style={styles.bankLabel}>IBAN</Text><Text style={styles.bankValue}>{org.bank_iban}</Text></View> : null}
                {org.bank_bic ? <View style={styles.bankField}><Text style={styles.bankLabel}>BIC / SWIFT</Text><Text style={styles.bankValue}>{org.bank_bic}</Text></View> : null}
              </View>
              <Text style={{ fontSize: 8, color: "#9ca3af", marginTop: 6 }}>Reference: #{invoice.invoice_number}</Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>{org.name}</Text>
            <Text style={styles.footerText}>Powered by invoyr</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
