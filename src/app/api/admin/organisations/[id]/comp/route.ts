import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  // null / empty clears the comp and returns the org to normal billing.
  comp_plan: z.enum(["starter", "business", "pro"]).nullable(),
  comp_reason: z.string().trim().max(120).nullable().optional(),
  // ISO date/datetime string, or null for "never expires".
  comp_expires_at: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .nullable()
    .optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const comp_plan = parsed.data.comp_plan;
  const comp_reason = comp_plan ? parsed.data.comp_reason ?? null : null;
  const comp_expires_at = comp_plan ? parsed.data.comp_expires_at ?? null : null;

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("organisations")
    .update({ comp_plan, comp_reason, comp_expires_at })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("audit_logs").insert({
    org_id: id,
    user_id: admin.id,
    action: comp_plan ? "org.comp_granted" : "org.comp_revoked",
    entity_type: "organisation",
    entity_id: id,
    meta: { comp_plan, comp_reason, comp_expires_at },
  });

  return NextResponse.json({ success: true });
}
