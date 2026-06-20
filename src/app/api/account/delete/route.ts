import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Type "DELETE MY ACCOUNT" to confirm.' },
      { status: 400 }
    );
  }

  const serviceClient = await createServiceClient();

  // Find orgs this user owns
  const { data: ownedOrgs } = await serviceClient
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("role", "owner");

  // Check if any owned org has other members — if so, block deletion
  for (const { org_id } of ownedOrgs ?? []) {
    const { count } = await serviceClient
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org_id);

    if ((count ?? 0) > 1) {
      return NextResponse.json(
        { error: "Transfer ownership or remove other team members before deleting your account." },
        { status: 409 }
      );
    }
  }

  // Delete owned orgs (cascades to all org-scoped data via FK)
  for (const { org_id } of ownedOrgs ?? []) {
    await serviceClient.from("organisations").delete().eq("id", org_id);
  }

  // Remove from any remaining org memberships (as non-owner)
  await serviceClient.from("org_members").delete().eq("user_id", user.id);

  // Delete email preferences and marketing contacts
  await serviceClient.from("email_preferences").delete().eq("user_id", user.id);
  await serviceClient.from("marketing_contacts").delete().eq("user_id", user.id);

  // Sign out before deleting — client session will be invalidated
  await supabase.auth.signOut();

  // Delete the auth user (must be service role)
  await serviceClient.auth.admin.deleteUser(user.id);

  return NextResponse.json({ ok: true });
}
