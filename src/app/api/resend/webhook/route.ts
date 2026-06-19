import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
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
    await supabase
      .from("email_logs")
      .update({ opened_at: new Date().toISOString() })
      .eq("resend_id", resendId);
  }

  return NextResponse.json({ ok: true });
}
