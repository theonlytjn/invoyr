import { createClient } from "@/lib/supabase/server";
import { requireOrg, requireUser } from "@/lib/auth";
import TeamPanel from "@/components/team/TeamPanel";
import type { Metadata } from "next";
import type { OrgMemberWithProfile, OrgInvite } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Settings — Team" };

export default async function TeamSettingsPage() {
  const org = await requireOrg();
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: membersRaw }, { data: invitesRaw }, { data: currentMember }] = await Promise.all([
    supabase
      .from("org_members")
      .select("*, profiles(full_name)")
      .eq("org_id", org.id)
      .order("created_at"),
    supabase
      .from("org_invites")
      .select("*")
      .eq("org_id", org.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .single(),
  ]);

  const members = (membersRaw ?? []) as OrgMemberWithProfile[];
  const invites = (invitesRaw ?? []) as OrgInvite[];
  const currentUserRole = currentMember?.role ?? "member";

  return (
    <TeamPanel
      members={members}
      invites={invites}
      currentUserId={user.id}
      currentUserRole={currentUserRole}
    />
  );
}
