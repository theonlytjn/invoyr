import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  plan: z.string().min(1),
  status: z.enum(["trialing", "active", "past_due", "canceled", "incomplete"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const supabase = await createServiceClient();
  const { plan, status } = parsed.data;

  // Check if a row already exists
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("org_id", id)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("subscriptions")
      .update({ plan, status, updated_at: new Date().toISOString() })
      .eq("org_id", id));
  } else {
    ({ error } = await supabase
      .from("subscriptions")
      .insert({ org_id: id, plan, status }));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
