import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/shell/AppShell";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth";
import { getOrgPlan, getSubscription, trialDaysRemaining } from "@/lib/billing";
import { ADMIN_EMAIL } from "@/lib/admin";
import type { Organisation } from "@/lib/supabase/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id, role, organisations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const orgs: Organisation[] = (memberships ?? []).flatMap((m) => {
    const o = m.organisations as unknown;
    return Array.isArray(o) ? (o as Organisation[]) : o ? [o as Organisation] : [];
  });

  // Resolve active org via cookie, fall back to first
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const activeOrg = (activeId ? orgs.find((o) => o.id === activeId) : null) ?? orgs[0] ?? null;

  // Comp-aware: complimentary grants win, and canceled/past_due rows don't count.
  const plan = activeOrg?.id ? await getOrgPlan(activeOrg.id) : null;

  // Days left in a running trial, so the shell can count it down on every page.
  // Null for comped orgs and paid subscriptions — neither is counting down.
  const sub = activeOrg?.id ? await getSubscription(activeOrg.id) : null;
  const trialDaysLeft = trialDaysRemaining(sub?.status, sub?.trial_ends_at);

  const isAdmin = user.email === ADMIN_EMAIL;

  return (
    <AppShell org={activeOrg} orgs={orgs} userEmail={user.email ?? ""} plan={plan} trialDaysLeft={trialDaysLeft} isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
