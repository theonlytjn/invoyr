import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceTemplateProps } from "./types";

export default function ModernStudio({ invoice, items, client, org, totals }: InvoiceTemplateProps) {
  return (
    <div className="bg-white p-10 font-sans text-gray-900" style={{ width: 794, minHeight: 1123 }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logo_url} alt={org.name} className="h-10 object-contain" />
          ) : (
            <p className="text-2xl font-black tracking-tight" style={{ color: org.accent_color }}>
              {org.name}
            </p>
          )}
          {org.vat_number && (
            <p className="text-xs text-gray-400 mt-1">VAT No: {org.vat_number}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Invoice</p>
          <p className="text-3xl font-black text-gray-900">{invoice.invoice_number}</p>
        </div>
      </div>

      {/* Two-column info */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Billed to</p>
          {client ? (
            <>
              <p className="font-bold">{client.company_name ?? client.name}</p>
              {client.name !== client.company_name && <p className="text-sm text-gray-600">{client.name}</p>}
              {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
              {client.address_line1 && <p className="text-sm text-gray-500">{client.address_line1}</p>}
              {client.city && <p className="text-sm text-gray-500">{client.city}</p>}
              {client.vat_number && <p className="text-sm text-gray-500">VAT: {client.vat_number}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No client assigned</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Payment to</p>
          <p className="font-bold">{org.name}</p>
          {org.address_line1 && <p className="text-sm text-gray-500">{org.address_line1}</p>}
          {org.city && <p className="text-sm text-gray-500">{org.city}{org.postcode ? ` ${org.postcode}` : ""}</p>}
          {org.email && <p className="text-sm text-gray-500">{org.email}</p>}
          <div className="mt-3 space-y-0.5">
            <p className="text-sm"><span className="text-gray-400">Issued:</span> {formatDate(invoice.issue_date)}</p>
            {invoice.due_date && (
              <p className="text-sm"><span className="text-gray-400">Due:</span> {formatDate(invoice.due_date)}</p>
            )}
            {invoice.po_number && (
              <p className="text-sm"><span className="text-gray-400">PO:</span> {invoice.po_number}</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-900 mb-6" />

      {/* Items */}
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="text-xs text-gray-400 uppercase tracking-widest">
            <th className="text-left pb-3 font-medium">Service</th>
            <th className="text-right pb-3 font-medium">Qty</th>
            <th className="text-right pb-3 font-medium">Unit price</th>
            <th className="text-right pb-3 font-medium">VAT</th>
            <th className="text-right pb-3 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-3 font-medium">{item.description}</td>
              <td className="py-3 text-right text-gray-500">{item.quantity}</td>
              <td className="py-3 text-right text-gray-500">{formatCurrency(item.unit_price, invoice.currency)}</td>
              <td className="py-3 text-right text-gray-500">{item.vat_rate}%</td>
              <td className="py-3 text-right font-semibold">{formatCurrency(item.line_total, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-between items-end">
        <div className="text-sm text-gray-500 max-w-xs">
          {(invoice.notes || invoice.terms || org.default_terms) && (
            <p className="italic">{invoice.notes ?? invoice.terms ?? org.default_terms}</p>
          )}
        </div>
        <div className="w-52 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>{formatCurrency(totals.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>VAT</span><span>{formatCurrency(totals.vatAmount, invoice.currency)}</span>
          </div>
          {(totals.discount ?? 0) > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Discount</span><span>−{formatCurrency(totals.discount!, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-lg pt-2 border-t-2 border-gray-900">
            <span>Total</span>
            <span style={{ color: org.accent_color }}>{formatCurrency(totals.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* Bank details */}
      {(org.bank_account_name || org.bank_account_number) && (
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Bank transfer</p>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
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
              <div className="col-span-2">
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
          <p className="text-xs text-gray-400 mt-2">
            Reference: <span className="font-medium text-gray-700">#{invoice.invoice_number}</span>
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
        <p>{org.website ?? org.email ?? org.name}</p>
        <p>Powered by invoyr</p>
      </div>
    </div>
  );
}
