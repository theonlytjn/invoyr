import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();

  try {
    const wh = new Webhook(webhookSecret);
    wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = payload.type as string | undefined;
  const data = payload.data as Record<string, unknown> | undefined;

  if (!type || !data) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createServiceClient();

  const resendId = data.email_id as string | undefined;
  if (!resendId) return NextResponse.json({ ok: true });

  if (type === "email.delivered") {
    await supabase
      .from("email_logs")
      .update({ status: "delivered" })
      .eq("resend_id", resendId);
  }

  if (type === "email.bounced" || type === "email.delivery_delayed") {
    await supabase
      .from("email_logs")
      .update({ status: "failed" })
      .eq("resend_id", resendId);
  }

  if (type === "email.opened") {
    const openedAt = new Date().toISOString();

    const { data: log } = await supabase
      .from("email_logs")
      .select("id, invoice_id, org_id, opened_at, template_name")
      .eq("resend_id", resendId)
      .maybeSingle();

    if (log) {
      // Only update and audit on first open
      if (!log.opened_at) {
        await supabase
          .from("email_logs")
          .update({ opened_at: openedAt })
          .eq("id", log.id);

        if (log.invoice_id && log.org_id) {
          await supabase.from("audit_logs").insert({
            org_id: log.org_id,
            action: "invoice.viewed",
            entity_type: "invoice",
            entity_id: log.invoice_id,
            meta: { template_name: log.template_name },
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
