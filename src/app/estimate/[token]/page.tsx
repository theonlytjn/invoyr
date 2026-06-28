import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeTotals } from "@/lib/invoice-totals";
import EstimateDecisionButtons from "./EstimateDecisionButtons";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicEstimatePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, clients(*), estimate_items(*)")
    .eq("public_token", token)
    .single();

  if (!estimate) notFound();

  const { data: orgRow } = await supabase
    .from("organisations")
    .select("name, logo_url, accent_color")
    .eq("id", estimate.org_id)
    .single();

  const items = estimate.estimate_items ?? [];
  const client = Array.isArray(estimate.clients) ? estimate.clients[0] : estimate.clients;
  const totals = computeTotals(
    items.map((i: { quantity: number; unit_price: number; vat_rate: number }) => ({
      description: "",
      quantity: i.quantity,
      unit_price: i.unit_price,
      vat_rate: i.vat_rate,
    }))
  );

  const accentColor = orgRow?.accent_color ?? "#111827";
  const isDecided = ["approved", "rejected", "converted"].includes(estimate.status);

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
          <p className="text-xl font-bold">{orgRow?.name ?? "Estimate"}</p>
          <p className="text-sm opacity-75 mt-1">{estimate.estimate_number}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {isDecided ? (
            <div className="text-center py-6">
              {estimate.status === "approved" || estimate.status === "converted" ? (
                <>
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">Estimate approved</p>
                  <p className="text-sm text-gray-500 mt-1">Thank you — we&apos;ll be in touch shortly.</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">Estimate declined</p>
                  <p className="text-sm text-gray-500 mt-1">This estimate has already been declined.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimate number</span>
                <span className="font-medium">{estimate.estimate_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Issue date</span>
                <span>{formatDate(estimate.issue_date)}</span>
              </div>
              {estimate.expiry_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valid until</span>
                  <span className={new Date(estimate.expiry_date) < new Date() ? "text-red-600 font-medium" : ""}>
                    {formatDate(estimate.expiry_date)}
                  </span>
                </div>
              )}
              {client && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Prepared for</span>
                  <span>{client.company_name ?? client.name}</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                {items.map((item: { id: number; description: string; quantity: number; unit_price: number; line_total: number }) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.description}</span>
                    <span>{formatCurrency(item.line_total, estimate.currency)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal, estimate.currency)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Discount</span>
                    <span>−{formatCurrency(totals.discount, estimate.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>VAT</span>
                  <span>{formatCurrency(totals.vat_amount, estimate.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span style={{ color: accentColor }}>{formatCurrency(estimate.total, estimate.currency)}</span>
                </div>
              </div>

              {estimate.notes && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{estimate.notes}</p>
                </div>
              )}

              {estimate.terms && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Terms</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{estimate.terms}</p>
                </div>
              )}

              <EstimateDecisionButtons estimateId={estimate.id} accentColor={accentColor} />
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
