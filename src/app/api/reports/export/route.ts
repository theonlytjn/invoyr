import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("invoice_number, issue_date, due_date, paid_at, status, currency, subtotal, vat_amount, total, amount_paid, clients(name, company_name, email)")
    .eq("org_id", org.id)
    .order("issue_date", { ascending: false });

  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const headers = [
    "Invoice #",
    "Client",
    "Company",
    "Email",
    "Status",
    "Issue date",
    "Due date",
    "Paid date",
    "Currency",
    "Net",
    "VAT",
    "Gross",
    "Amount paid",
  ];

  const rows = (invoices ?? []).map((inv) => {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    return [
      inv.invoice_number,
      client?.name ?? "",
      client?.company_name ?? "",
      client?.email ?? "",
      inv.status,
      inv.issue_date ?? "",
      inv.due_date ?? "",
      inv.paid_at ?? "",
      inv.currency ?? "GBP",
      inv.subtotal ?? 0,
      inv.vat_amount ?? 0,
      inv.total ?? 0,
      inv.amount_paid ?? 0,
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const filename = `invoyr-report-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
