import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

const VALID_TRIGGERS = ["invoice.overdue", "invoice.paid", "invoice.sent", "estimate.approved", "estimate.expired"];
const VALID_ACTIONS = ["send_client_email", "notify_owner"];

const schema = z.object({
  name: z.string().min(1).max(100),
  trigger: z.string(),
  conditions: z.object({
    amount_gt: z.number().optional(),
    days_overdue_gt: z.number().optional(),
    currency: z.string().optional(),
  }).optional().default({}),
  action_type: z.string(),
  action_config: z.object({
    subject: z.string().min(1).max(200),
    body: z.string().max(2000),
  }),
  enabled: z.boolean().optional().default(true),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  const { data } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (!VALID_TRIGGERS.includes(parsed.data.trigger)) {
    return NextResponse.json({ error: `Invalid trigger: ${parsed.data.trigger}` }, { status: 400 });
  }
  if (!VALID_ACTIONS.includes(parsed.data.action_type)) {
    return NextResponse.json({ error: `Invalid action: ${parsed.data.action_type}` }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  const { data, error } = await supabase
    .from("automation_rules")
    .insert({ org_id: org.id, ...parsed.data })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
