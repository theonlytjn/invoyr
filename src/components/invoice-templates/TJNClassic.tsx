import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceTemplateProps } from "./types";

export default function TJNClassic({ invoice, items, client, org, totals, documentType = "invoice" }: InvoiceTemplateProps) {
  return (
    <div className="bg-white p-10 font-sans text-gray-900" style={{ width: 794, minHeight: 1123 }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logo_url} alt={org.name} className="h-12 object-contain mb-3" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-white font-bold text-xl"
              style={{ backgroundColor: org.accent_color }}
            >
              {org.name[0]}
            </div>
          )}
          <p className="font-bold text-xl">{org.name}</p>
          {org.address_line1 && <p className="text-sm text-gray-500">{org.address_line1}</p>}
          {org.city && <p className="text-sm text-gray-500">{org.city}{org.postcode ? `, ${org.postcode}` : ""}</p>}
          {org.vat_number && <p className="text-sm text-gray-500">VAT: {org.vat_number}</p>}
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900 mb-1">{documentType === "estimate" ? "ESTIMATE" : "INVOICE"}</p>
          <p className="text-lg font-semibold" style={{ color: org.accent_color }}>
            #{invoice.invoice_number}
          </p>
          <div className="mt-3 space-y-0.5 text-sm">
            <p><span className="text-gray-500">Issue date:</span> {formatDate(invoice.issue_date)}</p>
            {invoice.due_date && (
              <p><span className="text-gray-500">Due date:</span> {formatDate(invoice.due_date)}</p>
            )}
            {invoice.po_number && (
              <p><span className="text-gray-500">PO number:</span> {invoice.po_number}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bill to */}
      {client && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bill to</p>
          <p className="font-semibold">{client.company_name ?? client.name}</p>
          {client.name !== client.company_name && <p className="text-sm text-gray-600">{client.name}</p>}
          {client.address_line1 && <p className="text-sm text-gray-600">{client.address_line1}</p>}
          {client.city && <p className="text-sm text-gray-600">{client.city}{client.postcode ? `, ${client.postcode}` : ""}</p>}
          {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
          {client.vat_number && <p className="text-sm text-gray-600">VAT: {client.vat_number}</p>}
        </div>
      )}

      {/* Line items */}
      <table className="w-full mb-6">
        <thead>
          <tr style={{ borderBottom: `2px solid ${org.accent_color}` }}>
            <th className="text-left py-2 text-sm font-semibold text-gray-700">Description</th>
            <th className="text-right py-2 text-sm font-semibold text-gray-700">Qty</th>
            <th className="text-right py-2 text-sm font-semibold text-gray-700">Unit price</th>
            <th className="text-right py-2 text-sm font-semibold text-gray-700">VAT</th>
            <th className="text-right py-2 text-sm font-semibold text-gray-700">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2.5 text-sm">{item.description}</td>
              <td className="py-2.5 text-sm text-right text-gray-600">{item.quantity}</td>
              <td className="py-2.5 text-sm text-right text-gray-600">{formatCurrency(item.unit_price, invoice.currency)}</td>
              <td className="py-2.5 text-sm text-right text-gray-600">{item.vat_rate}%</td>
              <td className="py-2.5 text-sm text-right font-medium">{formatCurrency(item.line_total, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-56 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(totals.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">VAT</span>
            <span>{formatCurrency(totals.vatAmount, invoice.currency)}</span>
          </div>
          {(totals.discount ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span>−{formatCurrency(totals.discount!, invoice.currency)}</span>
            </div>
          )}
          <div
            className="flex justify-between font-bold text-base pt-2 mt-2"
            style={{ borderTop: `2px solid ${org.accent_color}` }}
          >
            <span>Total</span>
            <span style={{ color: org.accent_color }}>{formatCurrency(totals.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* Notes / Terms */}
      {(invoice.notes || invoice.terms || org.default_terms) && (
        <div className="border-t border-gray-200 pt-6 space-y-3">
          {invoice.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
          {(invoice.terms ?? org.default_terms) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment terms</p>
              <p className="text-sm text-gray-600">{invoice.terms ?? org.default_terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Bank details */}
      {(org.bank_account_name || org.bank_account_number) && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Payment by bank transfer</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {org.bank_account_name && (
              <div>
                <p className="text-xs text-gray-400">Account name</p>
                <p className="text-sm font-medium text-gray-900">{org.bank_account_name}</p>
              </div>
            )}
            {org.bank_name && (
              <div>
                <p className="text-xs text-gray-400">Bank</p>
                <p className="text-sm font-medium text-gray-900">{org.bank_name}</p>
              </div>
            )}
            {org.bank_account_number && (
              <div>
                <p className="text-xs text-gray-400">Account number</p>
                <p className="text-sm font-medium text-gray-900">{org.bank_account_number}</p>
              </div>
            )}
            {org.bank_sort_code && (
              <div>
                <p className="text-xs text-gray-400">Sort code</p>
                <p className="text-sm font-medium text-gray-900">{org.bank_sort_code}</p>
              </div>
            )}
            {org.bank_iban && (
              <div>
                <p className="text-xs text-gray-400">IBAN</p>
                <p className="text-sm font-medium text-gray-900">{org.bank_iban}</p>
              </div>
            )}
            {org.bank_bic && (
              <div>
                <p className="text-xs text-gray-400">BIC / SWIFT</p>
                <p className="text-sm font-medium text-gray-900">{org.bank_bic}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Please use <span className="font-medium text-gray-600">#{invoice.invoice_number}</span> as your payment reference.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pt-4 border-t border-gray-100 flex justify-between items-center">
        <p className="text-xs text-gray-400">{org.name}</p>
        <p className="text-xs text-gray-400">Powered by invoyr</p>
      </div>
    </div>
  );
}
