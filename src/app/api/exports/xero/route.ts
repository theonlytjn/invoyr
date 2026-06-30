import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { csvResponse } from "@/lib/exports/csv-utils";
import {
  buildXeroInvoiceCsv,
  buildXeroContactsCsv,
  buildXeroExpensesCsv,
  categoryToXeroAccount,
} from "@/lib/exports/xero";

export async function GET(req: NextRequest) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type") ?? "invoices";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const today = new Date().toISOString().slice(0, 10);

  if (type === "contacts") {
    const { data: clients } = await supabase
      .from("clients")
      .select("name, company_name, email, address_line1, city, postcode, country")
      .eq("org_id", org.id)
      .eq("archived", false)
      .order("name");

    const rows = (clients ?? []).map((c) => ({
      name: c.company_name || c.name,
      email: c.email ?? "",
      addressLine1: c.address_line1 ?? "",
      city: c.city ?? "",
      postcode: c.postcode ?? "",
      country: c.country ?? "",
    }));

    return csvResponse(buildXeroContactsCsv(rows), `xero-contacts-${today}.csv`);
  }

  if (type === "expenses") {
    let q = supabase
      .from("expenses")
      .select("title, category, amount, currency, date")
      .eq("org_id", org.id)
      .order("date", { ascending: false });

    if (from) q = q.gte("date", from);
    if (to) q = q.lte("date", to);

    const { data: expenses } = await q;

    const rows = (expenses ?? []).map((e) => ({
      contactName: e.title,
      date: e.date,
      description: e.title,
      amount: Number(e.amount),
      currency: e.currency,
      accountCode: categoryToXeroAccount(e.category),
    }));

    return csvResponse(buildXeroExpensesCsv(rows), `xero-expenses-${today}.csv`);
  }

  // Default: invoices with line items
  let q = supabase
    .from("invoices")
    .select("invoice_number, po_number, issue_date, due_date, currency, clients(name, company_name, email), invoice_items(description, quantity, unit_price, vat_rate)")
    .eq("org_id", org.id)
    .not("status", "eq", "draft")
    .order("issue_date", { ascending: false });

  if (from) q = q.gte("issue_date", from);
  if (to) q = q.lte("issue_date", to);

  const { data: invoices } = await q;

  const xeroRows = [];
  for (const inv of invoices ?? []) {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    const items = Array.isArray(inv.invoice_items) ? inv.invoice_items : [];
    const contactName = client?.company_name || client?.name || "Unknown";
    const email = client?.email ?? "";

    if (items.length === 0) {
      xeroRows.push({
        contactName,
        email,
        invoiceNumber: inv.invoice_number,
        reference: inv.po_number ?? "",
        invoiceDate: inv.issue_date,
        dueDate: inv.due_date ?? inv.issue_date,
        description: "Invoice",
        quantity: 1,
        unitAmount: 0,
        vatRate: 0,
        currency: inv.currency,
      });
    } else {
      for (const item of items) {
        xeroRows.push({
          contactName,
          email,
          invoiceNumber: inv.invoice_number,
          reference: inv.po_number ?? "",
          invoiceDate: inv.issue_date,
          dueDate: inv.due_date ?? inv.issue_date,
          description: item.description,
          quantity: item.quantity,
          unitAmount: Number(item.unit_price),
          vatRate: Number(item.vat_rate),
          currency: inv.currency,
        });
      }
    }
  }

  return csvResponse(buildXeroInvoiceCsv(xeroRows), `xero-invoices-${today}.csv`);
}
