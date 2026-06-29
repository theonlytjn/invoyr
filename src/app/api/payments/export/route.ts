import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { requireOrgPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const permErr = await requireOrgPermission(org.id, "export_csv");
  if (permErr) return NextResponse.json({ error: permErr.error }, { status: permErr.status });

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, currency, method, paid_at, stripe_payment_intent_id, invoices(invoice_number, clients(name, email, company_name))")
    .eq("org_id", org.id)
    .order("paid_at", { ascending: false });

  const headers = [
    "Date",
    "Invoice #",
    "Client",
    "Company",
    "Email",
    "Amount",
    "Currency",
    "Method",
    "Stripe reference",
  ];

  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = (payments ?? []).map((p) => {
    const invoice = Array.isArray(p.invoices) ? p.invoices[0] : p.invoices;
    const client = invoice
      ? Array.isArray((invoice as { clients: unknown }).clients)
        ? ((invoice as { clients: { name?: string; email?: string; company_name?: string }[] }).clients)[0]
        : (invoice as { clients: { name?: string; email?: string; company_name?: string } | null }).clients
      : null;
    return [
      p.paid_at ? formatDate(p.paid_at) : "",
      (invoice as { invoice_number?: string } | null)?.invoice_number ?? "",
      client?.name ?? "",
      client?.company_name ?? "",
      client?.email ?? "",
      p.amount ?? 0,
      p.currency ?? "GBP",
      p.method ?? "",
      p.stripe_payment_intent_id ?? "",
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const filename = `payments-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
