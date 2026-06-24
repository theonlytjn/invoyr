import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
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
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const supabase = await createServiceClient();
  const { plan, status } = parsed.data;

  const { error } = await supabase
    .from("subscriptions")
    .upsert({ org_id: id, plan, status, updated_at: new Date().toISOString() }, { onConflict: "org_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
