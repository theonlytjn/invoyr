import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "tony@theonlytjn.com";

// For use in Server Components and layouts (uses redirect)
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }
  return user;
}

// For use in API route handlers (returns null instead of redirecting)
export async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}
