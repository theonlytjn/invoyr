import { createClient } from "./supabase/server";

export type OrgRole = "owner" | "admin" | "finance" | "member";

export type OrgAction =
  | "create_invoice"
  | "send_invoice"
  | "void_invoice"
  | "delete_invoice"
  | "record_payment"
  | "export_csv"
  | "manage_team"
  | "manage_billing"
  | "manage_settings"
  | "view_reports"
  | "transfer_ownership";

const ROLE_PERMISSIONS: Record<OrgAction, OrgRole[]> = {
  create_invoice:     ["owner", "admin", "finance", "member"],
  send_invoice:       ["owner", "admin", "finance", "member"],
  void_invoice:       ["owner", "admin"],
  delete_invoice:     ["owner", "admin"],
  record_payment:     ["owner", "admin", "finance"],
  export_csv:         ["owner", "admin", "finance"],
  manage_team:        ["owner", "admin"],
  manage_billing:     ["owner"],
  manage_settings:    ["owner", "admin"],
  view_reports:       ["owner", "admin", "finance"],
  transfer_ownership: ["owner"],
};

export function roleCanDo(role: string, action: OrgAction): boolean {
  return (ROLE_PERMISSIONS[action] as string[]).includes(role);
}

export async function getUserOrgRole(orgId: string): Promise<OrgRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  return (data?.role as OrgRole) ?? null;
}

export async function requireOrgPermission(orgId: string, action: OrgAction): Promise<{ error: string; status: number } | null> {
  const role = await getUserOrgRole(orgId);
  if (!role) return { error: "Unauthorized", status: 401 };
  if (!roleCanDo(role, action)) return { error: "Insufficient permissions", status: 403 };
  return null;
}
