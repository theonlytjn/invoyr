import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/shell/AppShell";
import type { Organisation } from "@/lib/supabase/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberRow } = await supabase
    .from("org_members")
    .select("org_id, organisations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawMember = memberRow as any;
  const rawOrg: Organisation | null = rawMember
    ? Array.isArray(rawMember.organisations)
      ? (rawMember.organisations[0] ?? null)
      : (rawMember.organisations ?? null)
    : null;

  let plan: string | null = null;
  if (rawOrg?.id) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("org_id", rawOrg.id)
      .single();
    plan = sub?.plan ?? (sub?.status === "trialing" ? "trial" : null);
  }

  return (
    <AppShell org={rawOrg} userEmail={user.email ?? ""} plan={plan}>
      {children}
    </AppShell>
  );
}
