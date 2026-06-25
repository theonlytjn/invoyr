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

  const { data: authUser, error } = await supabase.auth.admin.getUserById(id);
  if (error || !authUser?.user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("full_name, onboarding_completed").eq("id", id).single();
  const { data: member } = await supabase.from("org_members").select("org_id, organisations(id, name)").eq("user_id", id).single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberAny = member as any;
  const orgId: string | null = memberAny?.org_id ?? null;
  const orgName: string | null = Array.isArray(memberAny?.organisations)
    ? memberAny.organisations[0]?.name ?? null
    : memberAny?.organisations?.name ?? null;

  let plan: string | null = null;
  let status: string | null = null;
  if (orgId) {
    const { data: sub } = await supabase.from("subscriptions").select("plan, status").eq("org_id", orgId).maybeSingle();
    plan = sub?.plan ?? null;
    status = sub?.status ?? null;
  }

  return NextResponse.json({
    user: {
      id: authUser.user.id,
      email: authUser.user.email,
      created_at: authUser.user.created_at,
      last_sign_in_at: authUser.user.last_sign_in_at ?? null,
      profile: profile ?? null,
      org: orgId ? { id: orgId, name: orgName, plan, status } : null,
    },
  });
}
