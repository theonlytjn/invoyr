import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { AdminWelcomeEmail } from "@/emails/transactional/AdminWelcomeEmail";

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

  // 2. Create profile
  await supabase.from("profiles").insert({
    id: userId,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    onboarding_completed: true,
  });

  // 3. Create organisation
  const { data: org } = await supabase
    .from("organisations")
    .insert({ name: orgName, currency: "GBP" })
    .select("id")
    .single();

  if (!org) {
    // Roll back user if org creation failed
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Failed to create organisation" }, { status: 500 });
  }

  // 4. Add user as owner
  await supabase.from("org_members").insert({
    org_id: org.id,
    user_id: userId,
    role: "owner",
  });

  // 5. Audit log
  await supabase.from("audit_logs").insert({
    org_id: org.id,
    action: "user.created_by_admin",
    entity_type: "user",
    entity_id: userId,
    meta: { created_by: admin.email, email, org_name: orgName },
  });

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
