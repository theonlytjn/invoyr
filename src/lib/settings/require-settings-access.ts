import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { roleCanDo } from "@/lib/permissions";
import type { Organisation } from "@/lib/supabase/types";

/**
 * Shared gate for the settings routes that write to `organisations`.
 *
 * Those writes go through the service client because `orgs_update` is
 * owner-only while `manage_settings` also allows admins, and an UPDATE that RLS
 * filters out returns no error, so an admin used to see "Saved!" having saved
 * nothing. That makes this explicit permission check the only thing standing
 * in for RLS, so every such route must call it first.
 */
export async function requireSettingsAccess(): Promise<
  { org: Organisation; response?: undefined } | { org?: undefined; response: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const org = await requireOrg();

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.role || !roleCanDo(membership.role, "manage_settings")) {
    return {
      response: NextResponse.json(
        { error: "You don't have permission to change these settings." },
        { status: 403 }
      ),
    };
  }

  return { org };
}
