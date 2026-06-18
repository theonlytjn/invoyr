import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeTotals } from "@/lib/invoice-totals";
import PayButton from "./PayButton";

interface Props { params: Promise<{ token: string }> }

export default async function PayPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .eq("public_token", token)
    .single();

  if (!invoice || invoice.status === "void") notFound();

  const { data: orgRow } = await supabase
    .from("organisations")
    .select("name, logo_url, accent_color, email")
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="p-6 text-white"
          style={{ backgroundColor: orgRow?.accent_color ?? "#111827" }}
        >
          <p className="text-sm opacity-75 mb-1">Invoice from</p>
          <p className="text-xl font-bold">{orgRow?.name ?? "Invoice"}</p>
          <p className="text-sm opacity-75 mt-1">#{invoice.invoice_number}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {invoice.status === "paid" ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <p className="font-semibold text-gray-900">Invoice paid</p>
              <p className="text-sm text-gray-500 mt-1">Thank you for your payment.</p>
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
                  <span>Subtotal</span><span>{formatCurrency(totals.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>VAT</span><span>{formatCurrency(totals.vat_amount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
                  <span>Amount due</span>
                  <span style={{ color: orgRow?.accent_color ?? "#111827" }}>
                    {formatCurrency(amountDue, invoice.currency)}
                  </span>
                </div>
              </div>

              <PayButton invoiceId={invoice.id} accentColor={orgRow?.accent_color ?? "#111827"} />
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
