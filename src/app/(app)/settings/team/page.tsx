import { createClient } from "@/lib/supabase/server";
import { requireOrg, requireUser } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import TeamPanel from "@/components/team/TeamPanel";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import type { Metadata } from "next";
import type { OrgMemberWithProfile, OrgInvite } from "@/lib/supabase/types";
import { canAccess, TEAM_MEMBER_CAP, type PlanId } from "@/config/plans";

export const metadata: Metadata = { title: "Settings — Team" };

export default async function TeamSettingsPage() {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);

  if (!canAccess(plan, "team_members")) {
    return <UpgradePrompt feature="team_members" />;
  }

  const memberCap = TEAM_MEMBER_CAP[(plan as PlanId) ?? "starter"];
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
      memberCap={memberCap}
    />
  );
}
