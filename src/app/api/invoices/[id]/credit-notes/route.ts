import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { CreditNoteEmail } from "@/emails/transactional/CreditNoteEmail";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  amount: z.number().positive(),
  reason: z.string().optional(),
  sendEmail: z.boolean().optional().default(false),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creditNotes } = await supabase
    .from("credit_notes")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ creditNotes: creditNotes ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { amount, reason, sendEmail } = parsed.data;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(*), organisations(name, accent_color, logo_url, from_email, credit_note_prefix, next_credit_note_number)")
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["issued", "sent", "partial", "paid", "overdue"].includes(invoice.status)) {
    return NextResponse.json(
      { error: "Credit notes can only be issued for active or paid invoices" },
      { status: 400 }
    );
  }

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const org = Array.isArray(invoice.organisations) ? invoice.organisations[0] : invoice.organisations;

  const lateFee = (invoice as { late_fee_amount?: number }).late_fee_amount ?? 0;
  const creditAlready = (invoice as { credit_applied?: number }).credit_applied ?? 0;
  const remainingBalance = invoice.total + lateFee - invoice.amount_paid - creditAlready;

  if (amount > remainingBalance + 0.001) {
    return NextResponse.json(
      { error: `Credit amount cannot exceed the remaining balance of ${formatCurrency(remainingBalance, invoice.currency)}` },
      { status: 400 }
    );
  }

  const prefix = (org as { credit_note_prefix?: string })?.credit_note_prefix ?? "CN";
  const nextNum = (org as { next_credit_note_number?: number })?.next_credit_note_number ?? 1;
  const creditNoteNumber = `${prefix}-${String(nextNum).padStart(4, "0")}`;

  const { data: creditNote, error: insertError } = await supabase
    .from("credit_notes")
    .insert({
      org_id: invoice.org_id,
      invoice_id: id,
      client_id: invoice.client_id ?? null,
      credit_note_number: creditNoteNumber,
      amount,
      reason: reason ?? null,
      status: "issued",
    })
    .select()
    .single();

  if (insertError || !creditNote) {
    return NextResponse.json({ error: "Failed to create credit note" }, { status: 500 });
  }

  await supabase
    .from("organisations")
    .update({ next_credit_note_number: nextNum + 1 })
    .eq("id", invoice.org_id);

  const newCreditApplied = creditAlready + amount;
  const totalOwed = invoice.total + lateFee;
  let newStatus = invoice.status;
  let paidAt = invoice.paid_at ?? null;

  if (invoice.amount_paid + newCreditApplied >= totalOwed - 0.001) {
    newStatus = "paid";
    paidAt = paidAt ?? new Date().toISOString();
  } else if (invoice.amount_paid + newCreditApplied > 0) {
    newStatus = "partial";
  }

  await supabase
    .from("invoices")
    .update({ credit_applied: newCreditApplied, status: newStatus, paid_at: paidAt })
    .eq("id", id);

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    user_id: user.id,
    action: "invoice.credit_note_issued",
    entity_type: "invoice",
    entity_id: id,
    meta: { credit_note_number: creditNoteNumber, amount, reason: reason ?? null },
  });

  if (sendEmail && client?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
    const payUrl = invoice.public_token ? `${appUrl}/pay/${invoice.public_token}` : undefined;
    const logoUrl = (org as { logo_url?: string | null })?.logo_url
      ? (org as { logo_url: string }).logo_url.split("?")[0]
      : null;

    await sendTransactionalEmail({
      orgId: invoice.org_id,
      invoiceId: id,
      to: client.email,
      subject: `Credit note ${creditNoteNumber} from ${(org as { name?: string })?.name ?? ""}`,
      templateName: "credit-note",
      fromEmail: (org as { from_email?: string | null })?.from_email,
      react: createElement(CreditNoteEmail, {
        clientName: client.name ?? "there",
        orgName: (org as { name?: string })?.name ?? "",
        logoUrl,
        accentColor: (org as { accent_color?: string })?.accent_color ?? "#111827",
        creditNoteNumber,
        amount: formatCurrency(amount, invoice.currency),
        reason: reason ?? null,
        invoiceNumber: invoice.invoice_number,
        payUrl,
      }),
    });
  }

  return NextResponse.json({ creditNote });
}
