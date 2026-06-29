import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ token: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  issued: "Issued",
  overdue: "Overdue",
  paid: "Paid",
  void: "Void",
};

const STATUS_COLOR: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  sent: "bg-blue-100 text-blue-800",
  issued: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-600",
  void: "bg-gray-100 text-gray-400",
};

const ESTIMATE_LABEL: Record<string, string> = {
  sent: "Awaiting response",
  approved: "Approved",
  rejected: "Declined",
  converted: "Converted",
};

const ESTIMATE_COLOR: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  converted: "bg-purple-100 text-purple-800",
};

export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_token", token)
    .single();

  if (!client) notFound();

  const [{ data: org }, { data: invoices }, { data: estimates }] = await Promise.all([
    supabase
      .from("organisations")
      .select("name, logo_url, accent_color")
      .eq("id", client.org_id)
      .single(),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, issue_date, due_date, total, currency, public_token, amount_paid")
      .eq("client_id", client.id)
      .in("status", ["sent", "issued", "overdue", "paid"])
      .order("created_at", { ascending: false }),
    supabase
      .from("estimates")
      .select("id, estimate_number, status, issue_date, expiry_date, total, currency, public_token")
      .eq("client_id", client.id)
      .in("status", ["sent", "approved", "rejected", "converted"])
      .order("created_at", { ascending: false }),
  ]);

  const accentColor = org?.accent_color ?? "#111827";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  const outstanding = (invoices ?? [])
    .filter((i) => ["sent", "issued", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + (i.total - (i.amount_paid ?? 0)), 0);

  const defaultCurrency = invoices?.[0]?.currency ?? "GBP";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-8 px-4" style={{ backgroundColor: accentColor }}>
        <div className="max-w-3xl mx-auto">
          {org?.logo_url ? (
            <div className="inline-flex items-center justify-center bg-white mb-4" style={{ width: 64, height: 64, padding: 4, borderRadius: 8 }}>
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="mb-4 h-10 flex items-center">
              <span className="text-xl font-bold opacity-90">{org?.name}</span>
            </div>
          )}
          {org?.logo_url && <p className="font-bold text-lg mb-1">{org.name}</p>}
          <p className="opacity-75 text-sm">Client portal for {client.company_name ?? client.name}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Outstanding balance */}
        {outstanding > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Outstanding balance</p>
            <p className="text-3xl font-bold" style={{ color: accentColor }}>
              {formatCurrency(outstanding, defaultCurrency)}
            </p>
          </div>
        )}

        {/* Invoices */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Invoices</h2>
          </div>
          {!invoices?.length ? (
            <p className="text-sm text-gray-500 text-center py-10">No invoices yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices.map((inv) => {
                const balance = inv.total - (inv.amount_paid ?? 0);
                const payable = ["sent", "issued", "overdue"].includes(inv.status) && inv.public_token;
                const isOverdue = inv.status === "overdue";
                return (
                  <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{inv.invoice_number}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">{formatDate(inv.issue_date)}</p>
                        {inv.due_date && (
                          <p className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                            · Due {formatDate(inv.due_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(inv.status === "paid" ? inv.total : balance, inv.currency)}
                      </p>
                      <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </span>
                    </div>
                    {payable && (
                      <Link
                        href={`${appUrl}/pay/${inv.public_token}`}
                        className="shrink-0 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        Pay
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Estimates */}
        {!!estimates?.length && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Estimates</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {estimates.map((est) => (
                <div key={est.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{est.estimate_number}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">{formatDate(est.issue_date)}</p>
                      {est.expiry_date && (
                        <p className="text-xs text-gray-500">· Expires {formatDate(est.expiry_date)}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 text-sm">{formatCurrency(est.total, est.currency)}</p>
                    <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${ESTIMATE_COLOR[est.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {ESTIMATE_LABEL[est.status] ?? est.status}
                    </span>
                  </div>
                  {est.status === "sent" && est.public_token && (
                    <Link
                      href={`${appUrl}/estimate/${est.public_token}`}
                      className="shrink-0 px-3 py-1.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Review
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">Powered by invoyr</p>
      </div>
    </div>
  );
}
