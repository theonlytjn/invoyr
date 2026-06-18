import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Organisation } from "./supabase/types";

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

export async function getOrg(): Promise<Organisation | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("org_members")
    .select("org_id, organisations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!data) return null;

  const orgs = data.organisations as unknown;
  return Array.isArray(orgs) ? orgs[0] ?? null : (orgs as Organisation | null);
}

export async function requireOrg() {
  const org = await getOrg();
  if (!org) redirect("/onboarding");
  return org;
}
