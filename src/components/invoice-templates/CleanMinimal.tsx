import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceTemplateProps } from "./types";

export default function CleanMinimal({ invoice, items, client, org, totals }: InvoiceTemplateProps) {
  return (
    <div className="bg-white p-10 font-sans text-gray-900" style={{ width: 794, minHeight: 1123 }}>
      {/* Top strip */}
      <div className="h-1 w-full rounded-full mb-8" style={{ backgroundColor: org.accent_color }} />

      {/* Two-column header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <p className="font-bold text-2xl text-gray-900">{org.name}</p>
          {org.address_line1 && <p className="text-sm text-gray-400 mt-1">{org.address_line1}</p>}
          {org.city && <p className="text-sm text-gray-400">{org.city}</p>}
          {org.email && <p className="text-sm text-gray-400">{org.email}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Invoice</p>
          <p className="text-2xl font-bold" style={{ color: org.accent_color }}>
            {invoice.invoice_number}
          </p>
          <div className="mt-3 text-sm text-gray-500 space-y-0.5">
            <p>Issued {formatDate(invoice.issue_date)}</p>
            {invoice.due_date && <p>Due {formatDate(invoice.due_date)}</p>}
          </div>
        </div>
      </div>

      {/* Billed to */}
      {client && (
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Billed to</p>
          <p className="font-semibold text-gray-900">{client.company_name ?? client.name}</p>
          {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
          {client.address_line1 && <p className="text-sm text-gray-500">{client.address_line1}</p>}
        </div>
      )}

      {/* Items */}
      <table className="w-full mb-6 text-sm">
        <thead className="border-b border-gray-200">
          <tr>
            <th className="text-left pb-2 text-gray-400 font-medium">Description</th>
            <th className="text-right pb-2 text-gray-400 font-medium">Qty</th>
            <th className="text-right pb-2 text-gray-400 font-medium">Price</th>
            <th className="text-right pb-2 text-gray-400 font-medium">VAT</th>
            <th className="text-right pb-2 text-gray-400 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-50">
              <td className="py-3">{item.description}</td>
              <td className="py-3 text-right text-gray-500">{item.quantity}</td>
              <td className="py-3 text-right text-gray-500">{formatCurrency(item.unit_price, invoice.currency)}</td>
              <td className="py-3 text-right text-gray-500">{item.vat_rate}%</td>
              <td className="py-3 text-right font-medium">{formatCurrency(item.line_total, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-48 text-sm space-y-1">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>{formatCurrency(totals.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>VAT</span><span>{formatCurrency(totals.vatAmount, invoice.currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 mt-2">
            <span>Total</span>
            <span style={{ color: org.accent_color }}>{formatCurrency(totals.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {(invoice.notes || invoice.terms || org.default_terms) && (
        <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-2">
          {invoice.notes && <p>{invoice.notes}</p>}
          {(invoice.terms ?? org.default_terms) && <p>{invoice.terms ?? org.default_terms}</p>}
        </div>
      )}

      {(org.bank_account_name || org.bank_account_number) && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Bank transfer</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {org.bank_account_name && (
              <div>
                <p className="text-xs text-gray-400">Account name</p>
                <p className="text-sm text-gray-700">{org.bank_account_name}</p>
              </div>
            )}
            {org.bank_name && (
              <div>
                <p className="text-xs text-gray-400">Bank</p>
                <p className="text-sm text-gray-700">{org.bank_name}</p>
              </div>
            )}
            {org.bank_account_number && (
              <div>
                <p className="text-xs text-gray-400">Account number</p>
                <p className="text-sm text-gray-700">{org.bank_account_number}</p>
              </div>
            )}
            {org.bank_sort_code && (
              <div>
                <p className="text-xs text-gray-400">Sort code</p>
                <p className="text-sm text-gray-700">{org.bank_sort_code}</p>
              </div>
            )}
            {org.bank_iban && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400">IBAN</p>
                <p className="text-sm text-gray-700">{org.bank_iban}</p>
              </div>
            )}
            {org.bank_bic && (
              <div>
                <p className="text-xs text-gray-400">BIC / SWIFT</p>
                <p className="text-sm text-gray-700">{org.bank_bic}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Reference: <span className="text-gray-600">#{invoice.invoice_number}</span>
          </p>
        </div>
      )}

      <div className="mt-10 text-xs text-gray-300 text-center">
        {org.name} · Powered by invoyr
      </div>
    </div>
  );
}
