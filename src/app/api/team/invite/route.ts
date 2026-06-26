import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg, requireUser } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { TeamInviteEmail } from "@/emails/transactional/TeamInviteEmail";
import { z } from "zod";
import { createElement } from "react";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function POST(req: Request) {
  const org = await requireOrg();
  const user = await requireUser();
  const supabase = await createClient();

  // Only owner/admin can invite
  const { data: member } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Only owners and admins can invite members." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, role } = parsed.data;

  // Check not already a member
  const { data: existingMember } = await supabase
    .from("org_members")
    .select("id")
    .eq("org_id", org.id)
    .eq("user_id", (await supabase.from("profiles").select("id").eq("id", user.id).single()).data?.id ?? "")
    .maybeSingle();

  // Upsert invite (resend if already pending)
  const { data: invite, error } = await supabase
    .from("org_invites")
    .upsert(
      {
        org_id: org.id,
        email,
        role,
        invited_by: user.id,
        accepted_at: null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "org_id,email", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;
  const inviterName = inviterProfile?.full_name ?? user.email ?? "Someone";

  await sendTransactionalEmail({
    orgId: org.id,
    to: email,
    subject: `You've been invited to join ${org.name} on Invoyr`,
    templateName: "team-invite",
    react: createElement(TeamInviteEmail, { inviterName, orgName: org.name, inviteUrl }),
  });

  return NextResponse.json({ ok: true, invite });
}
