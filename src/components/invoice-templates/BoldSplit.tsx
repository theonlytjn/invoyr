import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceTemplateProps } from "./types";

export default function BoldSplit({ invoice, items, client, org, totals }: InvoiceTemplateProps) {
  const STATUS_LABEL: Record<string, string> = {
    draft: "DRAFT",
    issued: "UNPAID",
    sent: "AWAITING PAYMENT",
    paid: "PAID",
    overdue: "OVERDUE",
    void: "VOID",
  };

  return (
    <div className="bg-white font-sans text-gray-900" style={{ width: 794, minHeight: 1123 }}>
      {/* Bold header band */}
      <div className="p-10 text-white" style={{ backgroundColor: org.accent_color }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-2xl">{org.name}</p>
            {org.address_line1 && <p className="text-sm opacity-75 mt-1">{org.address_line1}</p>}
            {org.city && <p className="text-sm opacity-75">{org.city}</p>}
          </div>
          <div className="text-right">
            <p className="text-5xl font-black opacity-20 leading-none">INV</p>
            <p className="text-xl font-bold mt-1">{invoice.invoice_number}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
            {STATUS_LABEL[invoice.status] ?? invoice.status.toUpperCase()}
          </span>
          {invoice.due_date && (
            <span className="text-xs opacity-75">Due {formatDate(invoice.due_date)}</span>
          )}
          {invoice.po_number && (
            <span className="text-xs opacity-75">PO: {invoice.po_number}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-10">
        {/* Client */}
        {client && (
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed to</p>
            <p className="font-bold text-lg">{client.company_name ?? client.name}</p>
            {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
            {client.address_line1 && <p className="text-sm text-gray-500">{client.address_line1}</p>}
          </div>
        )}

        {/* Items */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-700">Item</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-700">Qty</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-700">Rate</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-700">VAT</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-3 py-3">{item.description}</td>
                <td className="px-3 py-3 text-right text-gray-500">{item.quantity}</td>
                <td className="px-3 py-3 text-right text-gray-500">{formatCurrency(item.unit_price, invoice.currency)}</td>
                <td className="px-3 py-3 text-right text-gray-500">{item.vat_rate}%</td>
                <td className="px-3 py-3 text-right font-semibold">{formatCurrency(item.line_total, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals block */}
        <div className="flex justify-end">
          <div
            className="w-56 p-4 rounded-xl text-sm space-y-1.5 text-white"
            style={{ backgroundColor: org.accent_color }}
          >
            <div className="flex justify-between opacity-75">
              <span>Subtotal</span><span>{formatCurrency(totals.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between opacity-75">
              <span>VAT</span><span>{formatCurrency(totals.vatAmount, invoice.currency)}</span>
            </div>
            {(totals.discount ?? 0) > 0 && (
              <div className="flex justify-between opacity-75">
                <span>Discount</span><span>−{formatCurrency(totals.discount!, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-white/20">
              <span>Total due</span><span>{formatCurrency(totals.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.terms || org.default_terms) && (
          <div className="mt-8 text-xs text-gray-500 space-y-1">
            {invoice.notes && <p>{invoice.notes}</p>}
            {(invoice.terms ?? org.default_terms) && <p>{invoice.terms ?? org.default_terms}</p>}
          </div>
        )}

        {(org.bank_account_name || org.bank_account_number) && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bank transfer details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {org.bank_account_name && (
                <div>
                  <p className="text-xs text-gray-400">Account name</p>
                  <p className="text-sm font-semibold">{org.bank_account_name}</p>
                </div>
              )}
              {org.bank_name && (
                <div>
                  <p className="text-xs text-gray-400">Bank</p>
                  <p className="text-sm font-semibold">{org.bank_name}</p>
                </div>
              )}
              {org.bank_account_number && (
                <div>
                  <p className="text-xs text-gray-400">Account number</p>
                  <p className="text-sm font-semibold">{org.bank_account_number}</p>
                </div>
              )}
              {org.bank_sort_code && (
                <div>
                  <p className="text-xs text-gray-400">Sort code</p>
                  <p className="text-sm font-semibold">{org.bank_sort_code}</p>
                </div>
              )}
              {org.bank_iban && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">IBAN</p>
                  <p className="text-sm font-semibold">{org.bank_iban}</p>
                </div>
              )}
              {org.bank_bic && (
                <div>
                  <p className="text-xs text-gray-400">BIC / SWIFT</p>
                  <p className="text-sm font-semibold">{org.bank_bic}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Reference: <span className="font-semibold text-gray-600">#{invoice.invoice_number}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
