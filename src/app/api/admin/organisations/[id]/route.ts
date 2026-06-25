import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: org } = await supabase.from("organisations").select("*").eq("id", id).single();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: sub } = await supabase.from("subscriptions").select("plan, status").eq("org_id", id).maybeSingle();
  const { count: memberCount } = await supabase.from("org_members").select("id", { count: "exact", head: true }).eq("org_id", id);

  return NextResponse.json({
    org: {
      ...org,
      subscription: sub ?? null,
      memberCount: memberCount ?? 0,
    },
  });
}
