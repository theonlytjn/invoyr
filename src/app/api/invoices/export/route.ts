import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, clients(name, email, company_name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const rows = (invoices ?? []).map((inv) => {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    return [
      inv.invoice_number,
      client?.name ?? "",
      client?.company_name ?? "",
      client?.email ?? "",
      inv.status,
      inv.issue_date ? formatDate(inv.issue_date) : "",
      inv.due_date ? formatDate(inv.due_date) : "",
      inv.currency,
      inv.subtotal,
      inv.vat_total,
      inv.total,
      inv.amount_paid,
      inv.paid_at ? formatDate(inv.paid_at) : "",
    ];
  });

  const headers = [
    "Invoice #",
    "Client name",
    "Company",
    "Client email",
    "Status",
    "Issue date",
    "Due date",
    "Currency",
    "Subtotal",
    "VAT",
    "Total",
    "Amount paid",
    "Paid date",
  ];

  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");

  const filename = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
