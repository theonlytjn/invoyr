import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceTemplateProps } from "../types";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 48, color: "#111827", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  logo: { height: 36, marginBottom: 4, objectFit: "contain" },
  orgNameAccent: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  vatNote: { fontSize: 8, color: "#9ca3af", marginTop: 2 },
  invoiceLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, textAlign: "right", marginBottom: 4 },
  invoiceNumber: { fontSize: 24, fontFamily: "Helvetica-Bold", textAlign: "right" },
  grid: { flexDirection: "row", marginBottom: 28, gap: 32 },
  gridCol: { flex: 1 },
  colLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  clientName: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  detail: { color: "#6b7280", fontSize: 9, marginBottom: 2 },
  divider: { height: 1, backgroundColor: "#111827", marginBottom: 16 },
  tableHeader: { flexDirection: "row", paddingBottom: 8, marginBottom: 4 },
  tableHeaderCell: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6", paddingVertical: 7 },
  tableCell: { fontSize: 9 },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  totalsArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 },
  notesArea: { flex: 1, paddingRight: 24 },
  notesText: { color: "#6b7280", fontSize: 9, fontStyle: "italic" },
  totalsBox: { width: 200 },
  subRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  subLabel: { color: "#6b7280", fontSize: 9 },
  subValue: { fontSize: 9, color: "#6b7280" },
  totalRowFinal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 2, borderTopColor: "#111827", paddingTop: 6, marginTop: 4 },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  bankSection: { borderTopWidth: 0.5, borderTopColor: "#f3f4f6", marginTop: 24, paddingTop: 14 },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  bankField: { minWidth: 110, marginBottom: 6 },
  bankLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  bankValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111827" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#f3f4f6" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

export default function ModernStudioPdf({ invoice, items, client, org, totals }: InvoiceTemplateProps) {
  const accent = org.accent_color ?? "#111827";
  const logoSrc = (org as { logoDataUrl?: string | null }).logoDataUrl ?? org.logo_url;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logo} />
            ) : (
              <Text style={[styles.orgNameAccent, { color: accent }]}>{org.name}</Text>
            )}
            {org.vat_number ? <Text style={styles.vatNote}>VAT No: {org.vat_number}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={styles.colLabel}>Billed to</Text>
            {client ? (
              <>
                <Text style={styles.clientName}>{client.company_name ?? client.name}</Text>
                {client.name !== client.company_name ? <Text style={styles.detail}>{client.name}</Text> : null}
                {client.email ? <Text style={styles.detail}>{client.email}</Text> : null}
                {client.address_line1 ? <Text style={styles.detail}>{client.address_line1}</Text> : null}
                {client.vat_number ? <Text style={styles.detail}>VAT: {client.vat_number}</Text> : null}
              </>
            ) : <Text style={styles.detail}>—</Text>}
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.colLabel}>Payment to</Text>
            <Text style={styles.clientName}>{org.name}</Text>
            {org.address_line1 ? <Text style={styles.detail}>{org.address_line1}</Text> : null}
            {org.city ? <Text style={styles.detail}>{org.city}{org.postcode ? ` ${org.postcode}` : ""}</Text> : null}
            {org.email ? <Text style={styles.detail}>{org.email}</Text> : null}
            <Text style={[styles.detail, { marginTop: 6 }]}>
              <Text style={{ color: "#9ca3af" }}>Issued: </Text>{formatDate(invoice.issue_date)}
            </Text>
            {invoice.due_date ? (
              <Text style={styles.detail}>
                <Text style={{ color: "#9ca3af" }}>Due: </Text>{formatDate(invoice.due_date)}
              </Text>
            ) : null}
            {invoice.po_number ? (
              <Text style={styles.detail}>
                <Text style={{ color: "#9ca3af" }}>PO: </Text>{invoice.po_number}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.col1]}>Service</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Unit price</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>VAT</Text>
          <Text style={[styles.tableHeaderCell, styles.col2]}>Amount</Text>
        </View>

        {items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.col1, { fontFamily: "Helvetica-Bold" }]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{formatCurrency(item.unit_price, invoice.currency)}</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", color: "#9ca3af" }]}>{item.vat_rate}%</Text>
            <Text style={[styles.tableCell, styles.col2, { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatCurrency(item.line_total, invoice.currency)}</Text>
          </View>
        ))}

        <View style={styles.totalsArea}>
          <View style={styles.notesArea}>
            {(invoice.notes || invoice.terms || org.default_terms) ? (
              <Text style={styles.notesText}>{invoice.notes ?? invoice.terms ?? org.default_terms}</Text>
            ) : null}
          </View>
          <View style={styles.totalsBox}>
            <View style={styles.subRow}>
              <Text style={styles.subLabel}>Subtotal</Text>
              <Text style={styles.subValue}>{formatCurrency(totals.subtotal, invoice.currency)}</Text>
            </View>
            <View style={styles.subRow}>
              <Text style={styles.subLabel}>VAT</Text>
              <Text style={styles.subValue}>{formatCurrency(totals.vatAmount, invoice.currency)}</Text>
            </View>
            {(totals.discount ?? 0) > 0 ? (
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>Discount</Text>
                <Text style={styles.subValue}>−{formatCurrency(totals.discount!, invoice.currency)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalValue, { color: accent }]}>{formatCurrency(totals.total, invoice.currency)}</Text>
            </View>
            {(totals.lateFeeAmount ?? 0) > 0 ? (
              <View style={[styles.subRow, { marginTop: 4 }]}>
                <Text style={[styles.subLabel, { color: "#ea580c" }]}>Late fee</Text>
                <Text style={[styles.subValue, { color: "#ea580c" }]}>+{formatCurrency(totals.lateFeeAmount!, invoice.currency)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {(org.bank_account_name || org.bank_account_number) ? (
          <View style={styles.bankSection}>
            <Text style={{ fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Bank transfer</Text>
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
          <Text style={styles.footerText}>{org.website ?? org.email ?? org.name}</Text>
          <Text style={styles.footerText}>Powered by invoyr</Text>
        </View>
      </Page>
    </Document>
  );
}
