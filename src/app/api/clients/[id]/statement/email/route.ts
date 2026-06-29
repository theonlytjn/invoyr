import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { render } from "@react-email/render";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getResend } from "@/lib/resend/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientStatementEmail } from "@/emails/transactional/ClientStatementEmail";
import type { Organisation, Client, Invoice } from "@/lib/supabase/types";

const STATEMENT_STATUSES = ["issued", "sent", "overdue", "paid", "partial"];

async function fetchLogoAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const [{ data: clientData }, { data: invoicesData }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).eq("org_id", org.id).single(),
    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", id)
      .eq("org_id", org.id)
      .in("status", STATEMENT_STATUSES)
      .order("issue_date", { ascending: false }),
  ]);

  if (!clientData) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const client = clientData as Client;
  if (!client.email) return NextResponse.json({ error: "Client has no email address" }, { status: 400 });

  const invoices = (invoicesData ?? []) as Invoice[];
  const currency = org.currency ?? "GBP";
  const statementDate = formatDate(new Date().toISOString());

  const totalBilled = invoices.reduce((s, i) => s + i.total + (i.late_fee_amount ?? 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + i.amount_paid, 0);
  const outstanding = totalBilled - totalPaid;

  // Build invoice rows for the email
  const invoiceRows = invoices.map((inv) => ({
    invoiceNumber: inv.invoice_number,
    issueDate: formatDate(inv.issue_date),
    dueDate: inv.due_date ? formatDate(inv.due_date) : null,
    status: inv.status,
    total: inv.total + (inv.late_fee_amount ?? 0),
    amountPaid: inv.amount_paid,
    balance: inv.total + (inv.late_fee_amount ?? 0) - inv.amount_paid,
  }));

  // Render HTML email
  const emailElement = createElement(ClientStatementEmail, {
    orgName: org.name,
    logoUrl: org.logo_url ? org.logo_url.split("?")[0] : null,
    accentColor: org.accent_color,
    clientName: client.company_name ?? client.name,
    statementDate,
    invoices: invoiceRows,
    totalBilled,
    totalPaid,
    outstanding,
    currency,
  });
  const html = await render(emailElement);

  // Generate PDF attachment
  const logoRawUrl = org.logo_url ? org.logo_url.split("?")[0] : null;
  const logoDataUrl = logoRawUrl ? await fetchLogoAsDataUrl(logoRawUrl) : null;
  const orgWithLogo: Organisation & { logoDataUrl?: string | null } = { ...org, logoDataUrl };

  const { default: ClientStatementPdf } = await import("@/components/statements/ClientStatementPdf");
  const { renderToBuffer } = await import("@react-pdf/renderer");

  const pdfElement = ClientStatementPdf({ org: orgWithLogo, client, invoices, statementDate, currency });
  const pdfBuffer = await renderToBuffer(pdfElement);

  const resend = getResend();
  const from = org.from_email ?? process.env.RESEND_FROM_EMAIL ?? "invoices@invoyr.io";
  const subject = `Statement of account from ${org.name}`;

  const { data, error: resendErr } = await resend.emails.send({
    from,
    to: client.email,
    subject,
    html,
    attachments: [
      {
        filename: `statement-${new Date().toISOString().slice(0, 10)}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  });

  const serviceClient = await createServiceClient();
  await serviceClient.from("email_logs").insert({
    org_id: org.id,
    resend_id: data?.id ?? null,
    to_email: client.email,
    subject,
    template_name: "client-statement",
    status: resendErr ? "failed" : "sent",
  });

  if (resendErr) {
    return NextResponse.json({ error: resendErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
