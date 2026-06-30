import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { csvResponse } from "@/lib/exports/csv-utils";
import {
  buildQboInvoiceCsv,
  buildQboCustomersCsv,
  buildQboExpensesCsv,
  categoryToQboAccount,
} from "@/lib/exports/quickbooks";

export async function GET(req: NextRequest) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type") ?? "invoices";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const today = new Date().toISOString().slice(0, 10);

  if (type === "customers") {
    const { data: clients } = await supabase
      .from("clients")
      .select("name, company_name, email, address_line1, city, postcode, country")
      .eq("org_id", org.id)
      .eq("archived", false)
      .order("name");

    const rows = (clients ?? []).map((c) => ({
      displayName: c.company_name || c.name,
      companyName: c.company_name ?? "",
      email: c.email ?? "",
      billingStreet: c.address_line1 ?? "",
      billingCity: c.city ?? "",
      billingPostcode: c.postcode ?? "",
      billingCountry: c.country ?? "",
    }));

    return csvResponse(buildQboCustomersCsv(rows), `quickbooks-customers-${today}.csv`);
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
      txnDate: e.date,
      vendor: e.title,
      description: e.title,
      category: categoryToQboAccount(e.category),
      amount: Number(e.amount),
      currency: e.currency,
    }));

    return csvResponse(buildQboExpensesCsv(rows), `quickbooks-expenses-${today}.csv`);
  }

  // Default: invoices with line items
  let q = supabase
    .from("invoices")
    .select("invoice_number, issue_date, due_date, currency, clients(name, company_name), invoice_items(description, quantity, unit_price, vat_rate)")
    .eq("org_id", org.id)
    .not("status", "eq", "draft")
    .order("issue_date", { ascending: false });

  if (from) q = q.gte("issue_date", from);
  if (to) q = q.lte("issue_date", to);

  const { data: invoices } = await q;

  const qboRows = [];
  for (const inv of invoices ?? []) {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    const items = Array.isArray(inv.invoice_items) ? inv.invoice_items : [];
    const customer = client?.company_name || client?.name || "Unknown";

    if (items.length === 0) {
      qboRows.push({
        invoiceNo: inv.invoice_number,
        customer,
        invoiceDate: inv.issue_date,
        dueDate: inv.due_date ?? inv.issue_date,
        description: "Invoice",
        quantity: 1,
        rate: 0,
        vatRate: 0,
        currency: inv.currency,
      });
    } else {
      for (const item of items) {
        qboRows.push({
          invoiceNo: inv.invoice_number,
          customer,
          invoiceDate: inv.issue_date,
          dueDate: inv.due_date ?? inv.issue_date,
          description: item.description,
          quantity: item.quantity,
          rate: Number(item.unit_price),
          vatRate: Number(item.vat_rate),
          currency: inv.currency,
        });
      }
    }
  }

  return csvResponse(buildQboInvoiceCsv(qboRows), `quickbooks-invoices-${today}.csv`);
}
