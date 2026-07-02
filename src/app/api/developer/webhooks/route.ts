import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { generateWebhookSecret } from "@/lib/webhooks/dispatch";

const VALID_EVENTS = [
  "invoice.sent", "invoice.paid", "invoice.void", "invoice.overdue",
  "estimate.approved", "estimate.rejected", "payment.received", "client.created",
];

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  const { data } = await supabase
    .from("webhook_endpoints")
    .select("id, url, events, enabled, last_triggered_at, failure_count, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const invalidEvents = parsed.data.events.filter((e) => !VALID_EVENTS.includes(e));
  if (invalidEvents.length) {
    return NextResponse.json({ error: `Unknown events: ${invalidEvents.join(", ")}` }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  const secret = generateWebhookSecret();

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .insert({
      org_id: org.id,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
    })
    .select("id, url, events, enabled, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return secret only once
  return NextResponse.json({ data, secret });
}
