import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ token: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { token } = await params;
  const supabase = await createClient();
  const service = await createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: invite } = await service
    .from("org_invites")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!invite) return NextResponse.json({ error: "Invite not found or already used." }, { status: 404 });
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
  }
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: "This invite was sent to a different email address." }, { status: 403 });
  }

  // Check not already a member
  const { data: existing } = await service
    .from("org_members")
    .select("id")
    .eq("org_id", invite.org_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await service.from("org_members").insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role,
    });
  }

  await service
    .from("org_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true, org_id: invite.org_id });
}
