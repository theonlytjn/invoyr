import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { AdminWelcomeEmail } from "@/emails/transactional/AdminWelcomeEmail";
import { buildOrgRow } from "@/lib/onboarding/org-input";

const schema = z.object({
  email:     z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName:  z.string().min(1).max(50),
  orgName:   z.string().min(1).max(100),
});

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "Inv-";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { email, firstName, lastName, orgName } = parsed.data;
  const tempPassword = generatePassword();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  const supabase = createServiceClient();

  // 1. Create auth user (pre-confirmed so they can log in immediately)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Failed to create user" }, { status: 400 });
  }

  const userId = authData.user.id;

  /** Undo the half-built account rather than leaving a login that goes nowhere. */
  async function rollback(orgId?: string) {
    if (orgId) await supabase.from("organisations").delete().eq("id", orgId);
    await supabase.auth.admin.deleteUser(userId);
  }

  // 2. Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    onboarding_completed: true,
  });

  if (profileError) {
    await rollback();
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // 3. Create organisation. buildOrgRow supplies the slug, which is NOT NULL
  // with no default — this route used to omit it (and pass a `currency` column
  // organisations does not have), so admin user creation had never worked.
  const orgId = crypto.randomUUID();
  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert(buildOrgRow({ name: orgName }, orgId))
    .select("id")
    .single();

  if (orgError || !org) {
    await rollback();
    return NextResponse.json(
      { error: orgError?.message ?? "Failed to create organisation" },
      { status: 500 }
    );
  }

  // 4. Add user as owner
  const { error: memberError } = await supabase.from("org_members").insert({
    org_id: org.id,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    await rollback(org.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // 5. Audit log — best-effort, but logged rather than discarded.
  const { error: auditError } = await supabase.from("audit_logs").insert({
    org_id: org.id,
    action: "user.created_by_admin",
    entity_type: "user",
    entity_id: userId,
    meta: { created_by: admin.email, email, org_name: orgName },
  });

  if (auditError) console.error("admin user-create audit log failed", auditError);

  // 6. Send welcome email
  await sendTransactionalEmail({
    orgId: org.id,
    to: email,
    subject: `Your Invoyr account is ready — ${orgName}`,
    templateName: "admin-welcome",
    react: createElement(AdminWelcomeEmail, {
      firstName,
      orgName,
      email,
      tempPassword,
      loginUrl: `${appUrl}/login`,
    }),
  });

  return NextResponse.json({
    ok: true,
    userId,
    orgId: org.id,
    tempPassword,
  });
}
