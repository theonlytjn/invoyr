import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { EstimateSentEmail } from "@/emails/transactional/EstimateSentEmail";
import { computeTotals } from "@/lib/invoice-totals";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, clients(*), estimate_items(*), organisations(name, accent_color, logo_url, from_email)")
    .eq("id", id)
    .single();

  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = Array.isArray(estimate.clients) ? estimate.clients[0] : estimate.clients;
  const org = Array.isArray(estimate.organisations) ? estimate.organisations[0] : estimate.organisations;

  if (!client?.email) return NextResponse.json({ error: "Client has no email address" }, { status: 400 });

  const items = estimate.estimate_items ?? [];
  const totals = computeTotals(
    items.map((i: { quantity: number; unit_price: number; vat_rate: number }) => ({
      description: "",
      quantity: i.quantity,
      unit_price: i.unit_price,
      vat_rate: i.vat_rate,
    }))
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  const viewUrl = estimate.public_token ? `${appUrl}/estimate/${estimate.public_token}` : appUrl;
  const logoUrl = org?.logo_url ? org.logo_url.split("?")[0] : null;

  const result = await sendTransactionalEmail({
    orgId: estimate.org_id,
    invoiceId: null,
    to: client.email,
    subject: `Estimate ${estimate.estimate_number}${org?.name ? ` from ${org.name}` : ""}`,
    templateName: "estimate-sent",
    fromEmail: (org as { from_email?: string | null })?.from_email,
    react: createElement(EstimateSentEmail, {
      clientName: client.name ?? "there",
      orgName: org?.name ?? "",
      logoUrl,
      accentColor: org?.accent_color ?? "#111827",
      estimateNumber: estimate.estimate_number,
      estimateTotal: formatCurrency(totals.total, estimate.currency),
      issueDate: estimate.issue_date ? formatDate(estimate.issue_date) : undefined,
      expiryDate: estimate.expiry_date ? formatDate(estimate.expiry_date) : undefined,
      viewUrl,
    }),
  });

  if (!result.ok) return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });

  await supabase
    .from("estimates")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("audit_logs").insert({
    org_id: estimate.org_id,
    action: "estimate.sent",
    entity_type: "estimate",
    entity_id: id,
    meta: { to: client.email, estimate_number: estimate.estimate_number },
  });

  return NextResponse.json({ ok: true });
}
