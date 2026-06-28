import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceTemplateProps } from "../types";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 48, color: "#111827", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  logo: { height: 40, marginBottom: 8, objectFit: "contain" },
  orgName: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  orgDetail: { color: "#6b7280", fontSize: 9, marginBottom: 2 },
  invoiceLabel: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  invoiceNumber: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right", marginBottom: 8 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  metaLabel: { color: "#6b7280", marginRight: 4 },
  billTo: { backgroundColor: "#f9fafb", padding: 12, borderRadius: 6, marginBottom: 24 },
  sectionLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  clientName: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  clientDetail: { color: "#6b7280", fontSize: 9, marginBottom: 2 },
  tableHeader: { flexDirection: "row", paddingBottom: 6, marginBottom: 4 },
  tableHeaderCell: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#374151" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6", paddingVertical: 7 },
  tableCell: { fontSize: 9 },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  totals: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalsBox: { width: 200 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalsLabel: { color: "#6b7280" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6, marginTop: 4 },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  notes: { borderTopWidth: 0.5, borderTopColor: "#e5e7eb", marginTop: 32, paddingTop: 16 },
  notesLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  bankSection: { borderTopWidth: 0.5, borderTopColor: "#e5e7eb", marginTop: 24, paddingTop: 14 },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  bankField: { minWidth: 120, marginBottom: 6 },
  bankLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  bankValue: { fontSize: 9, color: "#111827", fontFamily: "Helvetica-Bold" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 32, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#f3f4f6" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

export default function TJNClassicPdf({ invoice, items, client, org, totals }: InvoiceTemplateProps) {
  const accent = org.accent_color ?? "#111827";
  const logoSrc = (org as { logoDataUrl?: string | null }).logoDataUrl ?? org.logo_url;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logo} />
            ) : null}
            <Text style={styles.orgName}>{org.name}</Text>
            {org.address_line1 ? <Text style={styles.orgDetail}>{org.address_line1}</Text> : null}
            {org.city ? <Text style={styles.orgDetail}>{org.city}{org.postcode ? `, ${org.postcode}` : ""}</Text> : null}
            {org.email ? <Text style={styles.orgDetail}>{org.email}</Text> : null}
            {org.vat_number ? <Text style={styles.orgDetail}>VAT: {org.vat_number}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={[styles.invoiceNumber, { color: accent }]}>#{invoice.invoice_number}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Issue date:</Text>
              <Text>{formatDate(invoice.issue_date)}</Text>
            </View>
            {invoice.due_date ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Due date:</Text>
                <Text>{formatDate(invoice.due_date)}</Text>
              </View>
            ) : null}
            {invoice.po_number ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>PO number:</Text>
                <Text>{invoice.po_number}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bill to */}
        {client ? (
          <View style={styles.billTo}>
            <Text style={styles.sectionLabel}>Bill to</Text>
            <Text style={styles.clientName}>{client.company_name ?? client.name}</Text>
            {client.name !== client.company_name ? <Text style={styles.clientDetail}>{client.name}</Text> : null}
            {client.email ? <Text style={styles.clientDetail}>{client.email}</Text> : null}
            {client.address_line1 ? <Text style={styles.clientDetail}>{client.address_line1}</Text> : null}
            {client.vat_number ? <Text style={styles.clientDetail}>VAT: {client.vat_number}</Text> : null}
          </View>
        ) : null}

        {/* Table header */}
        <View style={[styles.tableHeader, { borderBottomWidth: 1.5, borderBottomColor: accent }]}>
          <Text style={[styles.tableHeaderCell, styles.col1]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Unit price</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>VAT</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Total</Text>
        </View>

        {/* Items */}
        {items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.col1]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#6b7280" }]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#6b7280" }]}>{formatCurrency(item.unit_price, invoice.currency)}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#6b7280" }]}>{item.vat_rate}%</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatCurrency(item.line_total, invoice.currency)}</Text>
          </View>
        ))}

        {/* Totals */}
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
            <View style={[styles.totalRow, { borderTopWidth: 2, borderTopColor: accent }]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalValue, { color: accent }]}>
                {formatCurrency(totals.total, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes / Terms */}
        {(invoice.notes || invoice.terms || org.default_terms) ? (
          <View style={styles.notes}>
            {invoice.notes ? (
              <>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={{ color: "#6b7280", fontSize: 9 }}>{invoice.notes}</Text>
              </>
            ) : null}
            {(invoice.terms ?? org.default_terms) ? (
              <>
                <Text style={[styles.notesLabel, { marginTop: 8 }]}>Payment terms</Text>
                <Text style={{ color: "#6b7280", fontSize: 9 }}>{invoice.terms ?? org.default_terms}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        {/* Bank details */}
        {(org.bank_account_name || org.bank_account_number) ? (
          <View style={styles.bankSection}>
            <Text style={[styles.notesLabel, { marginBottom: 8 }]}>Payment by bank transfer</Text>
            <View style={styles.bankGrid}>
              {org.bank_account_name ? (
                <View style={styles.bankField}>
                  <Text style={styles.bankLabel}>Account name</Text>
                  <Text style={styles.bankValue}>{org.bank_account_name}</Text>
                </View>
              ) : null}
              {org.bank_name ? (
                <View style={styles.bankField}>
                  <Text style={styles.bankLabel}>Bank</Text>
                  <Text style={styles.bankValue}>{org.bank_name}</Text>
                </View>
              ) : null}
              {org.bank_account_number ? (
                <View style={styles.bankField}>
                  <Text style={styles.bankLabel}>Account number</Text>
                  <Text style={styles.bankValue}>{org.bank_account_number}</Text>
                </View>
              ) : null}
              {org.bank_sort_code ? (
                <View style={styles.bankField}>
                  <Text style={styles.bankLabel}>Sort code</Text>
                  <Text style={styles.bankValue}>{org.bank_sort_code}</Text>
                </View>
              ) : null}
              {org.bank_iban ? (
                <View style={styles.bankField}>
                  <Text style={styles.bankLabel}>IBAN</Text>
                  <Text style={styles.bankValue}>{org.bank_iban}</Text>
                </View>
              ) : null}
              {org.bank_bic ? (
                <View style={styles.bankField}>
                  <Text style={styles.bankLabel}>BIC / SWIFT</Text>
                  <Text style={styles.bankValue}>{org.bank_bic}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: 8, color: "#9ca3af", marginTop: 6 }}>
              Please use invoice #{invoice.invoice_number} as your payment reference.
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{org.name}</Text>
          <Text style={styles.footerText}>Powered by invoyr</Text>
        </View>
      </Page>
    </Document>
  );
}
