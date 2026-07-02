import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import type { Organisation } from "./supabase/types";

export const ACTIVE_ORG_COOKIE = "active_org_id";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOnboarded() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  return user;
}

export async function getUserOrgs(): Promise<Organisation[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id, organisations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!memberships) return [];

  return memberships.flatMap((m) => {
    const o = m.organisations as unknown;
    return Array.isArray(o) ? (o as Organisation[]) : o ? [o as Organisation] : [];
  });
}

export async function getOrg(): Promise<Organisation | null> {
  const orgs = await getUserOrgs();
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  return (activeId ? orgs.find((o) => o.id === activeId) : null) ?? orgs[0];
}

export async function requireOrg() {
  const org = await getOrg();
  if (!org) redirect("/onboarding");
  return org;
}
