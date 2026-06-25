import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeTotals } from "@/lib/invoice-totals";
import PayButton from "./PayButton";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}

export default async function PayPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { paid } = await searchParams;
  const supabase = await createServiceClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .eq("public_token", token)
    .single();

  if (!invoice || invoice.status === "void") notFound();

  const { data: orgRow } = await supabase
    .from("organisations")
    .select("name, logo_url, accent_color, email, bank_account_name, bank_name, bank_account_number, bank_sort_code, bank_iban, bank_bic")
    .eq("id", invoice.org_id)
    .single();

  const items = invoice.invoice_items ?? [];
  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const totals = computeTotals(
    items.map((i: { quantity: number; unit_price: number; vat_rate: number }) => ({
      description: "",
      quantity: i.quantity,
      unit_price: i.unit_price,
      vat_rate: i.vat_rate,
    }))
  );

  const amountDue = invoice.total - invoice.amount_paid;
  const accentColor = orgRow?.accent_color ?? "#111827";
  const isPaid = invoice.status === "paid" || paid === "1";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 text-white" style={{ backgroundColor: accentColor }}>
          {orgRow?.logo_url ? (
            <div className="inline-flex items-center justify-center bg-white mb-3" style={{ width: 75, height: 75, padding: 1 }}>
              <img
                src={orgRow.logo_url}
                alt={orgRow.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : null}
          <p className="text-xl font-bold">{orgRow?.name ?? "Invoice"}</p>
          <p className="text-sm opacity-75 mt-1">#{invoice.invoice_number}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {isPaid ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">Payment received</p>
              <p className="text-sm text-gray-500 mt-1">
                Thank you! Invoice {invoice.invoice_number} has been paid.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice number</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Issue date</span>
                <span>{formatDate(invoice.issue_date)}</span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Due date</span>
                  <span className={new Date(invoice.due_date) < new Date() ? "text-red-600 font-medium" : ""}>
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
              )}
              {client && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Billed to</span>
                  <span>{client.company_name ?? client.name}</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                {items.map((item: { id: number; description: string; quantity: number; unit_price: number; line_total: number }) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.description}</span>
                    <span>{formatCurrency(item.line_total, invoice.currency)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>VAT</span>
                  <span>{formatCurrency(totals.vat_amount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
                  <span>Amount due</span>
                  <span style={{ color: accentColor }}>
                    {formatCurrency(amountDue, invoice.currency)}
                  </span>
                </div>
              </div>

              <PayButton token={token} accentColor={accentColor} />

              {(orgRow?.bank_account_name || orgRow?.bank_account_number) && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Or pay by bank transfer
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {orgRow.bank_account_name && (
                      <div>
                        <p className="text-xs text-gray-400">Account name</p>
                        <p className="text-sm font-medium text-gray-900">{orgRow.bank_account_name}</p>
                      </div>
                    )}
                    {orgRow.bank_name && (
                      <div>
                        <p className="text-xs text-gray-400">Bank</p>
                        <p className="text-sm font-medium text-gray-900">{orgRow.bank_name}</p>
                      </div>
                    )}
                    {orgRow.bank_account_number && (
                      <div>
                        <p className="text-xs text-gray-400">Account number</p>
                        <p className="text-sm font-medium text-gray-900">{orgRow.bank_account_number}</p>
                      </div>
                    )}
                    {orgRow.bank_sort_code && (
                      <div>
                        <p className="text-xs text-gray-400">Sort code</p>
                        <p className="text-sm font-medium text-gray-900">{orgRow.bank_sort_code}</p>
                      </div>
                    )}
                    {orgRow.bank_iban && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">IBAN</p>
                        <p className="text-sm font-medium text-gray-900">{orgRow.bank_iban}</p>
                      </div>
                    )}
                    {orgRow.bank_bic && (
                      <div>
                        <p className="text-xs text-gray-400">BIC / SWIFT</p>
                        <p className="text-sm font-medium text-gray-900">{orgRow.bank_bic}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Reference: <span className="font-medium text-gray-600">{invoice.invoice_number}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-400">Powered by invoyr</p>
        </div>
      </div>
    </div>
  );
}
