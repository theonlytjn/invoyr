import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceTemplateProps } from "../types";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 48, color: "#111827", backgroundColor: "#ffffff" },
  accentBar: { height: 3, borderRadius: 2, marginBottom: 28 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  logo: { height: 36, marginBottom: 6, objectFit: "contain" },
  orgName: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  orgDetail: { color: "#9ca3af", fontSize: 9, marginBottom: 2 },
  invoiceLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, textAlign: "right" },
  invoiceNumber: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right", marginBottom: 8 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  metaText: { color: "#6b7280", fontSize: 9 },
  billTo: { marginBottom: 24 },
  sectionLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  clientName: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  clientDetail: { color: "#6b7280", fontSize: 9, marginBottom: 2 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingBottom: 6, marginBottom: 4 },
  tableHeaderCell: { fontSize: 9, color: "#9ca3af", fontFamily: "Helvetica" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f9fafb", paddingVertical: 7 },
  tableCell: { fontSize: 9 },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  totals: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalsBox: { width: 180 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalsLabel: { color: "#6b7280" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6, marginTop: 4, borderTopWidth: 0.5, borderTopColor: "#e5e7eb" },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  notes: { marginTop: 24, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: "#f3f4f6" },
  notesLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  bankSection: { borderTopWidth: 0.5, borderTopColor: "#e5e7eb", marginTop: 20, paddingTop: 14 },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  bankField: { minWidth: 110, marginBottom: 6 },
  bankLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  bankValue: { fontSize: 9, color: "#374151" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#f9fafb" },
  footerText: { fontSize: 8, color: "#d1d5db" },
});

export default function CleanMinimalPdf({ invoice, items, client, org, totals }: InvoiceTemplateProps & { logoDataUrl?: string | null }) {
  const accent = org.accent_color ?? "#111827";
  const logoSrc = (org as { logoDataUrl?: string | null }).logoDataUrl ?? org.logo_url;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        <View style={styles.header}>
          <View>
            {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
            <Text style={styles.orgName}>{org.name}</Text>
            {org.address_line1 ? <Text style={styles.orgDetail}>{org.address_line1}</Text> : null}
            {org.city ? <Text style={styles.orgDetail}>{org.city}{org.postcode ? `, ${org.postcode}` : ""}</Text> : null}
            {org.email ? <Text style={styles.orgDetail}>{org.email}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <Text style={[styles.invoiceNumber, { color: accent }]}>{invoice.invoice_number}</Text>
            <View style={styles.metaRow}><Text style={styles.metaText}>Issued {formatDate(invoice.issue_date)}</Text></View>
            {invoice.due_date ? <View style={styles.metaRow}><Text style={styles.metaText}>Due {formatDate(invoice.due_date)}</Text></View> : null}
            {invoice.po_number ? <View style={styles.metaRow}><Text style={styles.metaText}>PO: {invoice.po_number}</Text></View> : null}
          </View>
        </View>

        {client ? (
          <View style={styles.billTo}>
            <Text style={styles.sectionLabel}>Billed to</Text>
            <Text style={styles.clientName}>{client.company_name ?? client.name}</Text>
            {client.email ? <Text style={styles.clientDetail}>{client.email}</Text> : null}
            {client.address_line1 ? <Text style={styles.clientDetail}>{client.address_line1}</Text> : null}
          </View>
        ) : null}

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.col1]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Price</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>VAT</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Amount</Text>
        </View>

        {items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.col1]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{formatCurrency(item.unit_price, invoice.currency)}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{item.vat_rate}%</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right" }]}>{formatCurrency(item.line_total, invoice.currency)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text>{formatCurrency(totals.subtotal, invoice.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT</Text>
              <Text>{formatCurrency(totals.vatAmount, invoice.currency)}</Text>
            </View>
            {(totals.discount ?? 0) > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text>−{formatCurrency(totals.discount!, invoice.currency)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalValue, { color: accent }]}>{formatCurrency(totals.total, invoice.currency)}</Text>
            </View>
          </View>
        </View>

        {(invoice.notes || invoice.terms || org.default_terms) ? (
          <View style={styles.notes}>
            {invoice.notes ? <><Text style={styles.notesLabel}>Notes</Text><Text style={{ color: "#6b7280", fontSize: 9 }}>{invoice.notes}</Text></> : null}
            {(invoice.terms ?? org.default_terms) ? <><Text style={[styles.notesLabel, { marginTop: 8 }]}>Terms</Text><Text style={{ color: "#6b7280", fontSize: 9 }}>{invoice.terms ?? org.default_terms}</Text></> : null}
          </View>
        ) : null}

        {(org.bank_account_name || org.bank_account_number) ? (
          <View style={styles.bankSection}>
            <Text style={[styles.notesLabel, { marginBottom: 8 }]}>Bank transfer</Text>
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
          <Text style={styles.footerText}>{org.name} · Powered by invoyr</Text>
        </View>
      </Page>
    </Document>
  );
}
