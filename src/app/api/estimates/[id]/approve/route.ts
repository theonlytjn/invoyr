import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { EstimateResponseEmail } from "@/emails/transactional/EstimateResponseEmail";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("id, org_id, estimate_number, status, total, currency, issue_date, clients(name)")
    .eq("id", id)
    .single();

  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["sent", "draft"].includes(estimate.status)) {
    return NextResponse.json({ error: "Estimate cannot be approved in its current state" }, { status: 400 });
  }

  await supabase
    .from("estimates")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("audit_logs").insert({
    org_id: estimate.org_id,
    action: "estimate.approved",
    entity_type: "estimate",
    entity_id: id,
    meta: { estimate_number: estimate.estimate_number },
  });

  // Notify org owner
  const [{ data: org }, { data: members }] = await Promise.all([
    supabase
      .from("organisations")
      .select("name, logo_url, accent_color, from_email")
      .eq("id", estimate.org_id)
      .single(),
    supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", estimate.org_id)
      .eq("role", "owner")
      .limit(1),
  ]);

  const ownerId = members?.[0]?.user_id;
  if (ownerId && org) {
    const { data: authUser } = await supabase.auth.admin.getUserById(ownerId);
    const ownerEmail = authUser?.user?.email;

    if (ownerEmail) {

      const client = Array.isArray(estimate.clients) ? estimate.clients[0] : estimate.clients;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
      const logoUrl = org.logo_url ? org.logo_url.split("?")[0] : null;

      await sendTransactionalEmail({
        orgId: estimate.org_id,
        to: ownerEmail,
        subject: `Estimate ${estimate.estimate_number} approved by ${client?.name ?? "client"}`,
        templateName: "estimate-approved",
        fromEmail: (org as { from_email?: string | null }).from_email,
        react: createElement(EstimateResponseEmail, {
          orgName: org.name,
          logoUrl,
          accentColor: org.accent_color ?? "#111827",
          estimateNumber: estimate.estimate_number,
          clientName: client?.name ?? "Your client",
          estimateTotal: formatCurrency(estimate.total, estimate.currency),
          issueDate: estimate.issue_date ? formatDate(estimate.issue_date) : undefined,
          response: "approved",
          viewUrl: `${appUrl}/estimates/${id}`,
        }),
      });

    }
  }

  return NextResponse.json({ ok: true });
}
