import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { AutomationEmail } from "@/emails/transactional/AutomationEmail";
import type { AutomationRule, AutomationConditions } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";

export interface AutomationPayload {
  invoice_id?: string;
  invoice_number?: string;
  estimate_id?: string;
  estimate_number?: string;
  client_id?: string;
  client_name?: string;
  client_email?: string;
  amount?: number;
  currency?: string;
  days_overdue?: number;
  pay_url?: string;
}

/** "£2,400.00" rather than "GBP 2400.00"; falls back if the currency code is unknown. */
export function formatAutomationAmount(amount: number | undefined, currency: string | undefined): string {
  if (amount == null) return "";
  try {
    return formatCurrency(amount, currency || "GBP");
  } catch {
    return `${currency ?? ""} ${amount.toFixed(2)}`.trim();
  }
}

export function interpolate(
  template: string,
  payload: AutomationPayload,
  orgName: string,
  recipientName = payload.client_name ?? "there",
): string {
  return template
    .replace(/\{\{recipient_name\}\}/g, recipientName)
    .replace(/\{\{client_name\}\}/g, payload.client_name ?? "there")
    .replace(/\{\{invoice_number\}\}/g, payload.invoice_number ?? "")
    .replace(/\{\{estimate_number\}\}/g, payload.estimate_number ?? "")
    .replace(/\{\{amount\}\}/g, formatAutomationAmount(payload.amount, payload.currency))
    .replace(/\{\{org_name\}\}/g, orgName)
    .replace(/\{\{days_overdue\}\}/g, String(payload.days_overdue ?? ""));
}

function meetsConditions(conditions: AutomationConditions, payload: AutomationPayload): boolean {
  if (conditions.amount_gt != null && (payload.amount ?? 0) <= conditions.amount_gt) return false;
  if (conditions.days_overdue_gt != null && (payload.days_overdue ?? 0) <= conditions.days_overdue_gt) return false;
  if (conditions.currency && payload.currency && conditions.currency !== payload.currency) return false;
  return true;
}

export async function runAutomations(
  orgId: string,
  trigger: string,
  payload: AutomationPayload
): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: rules }, { data: orgRow }] = await Promise.all([
    supabase
      .from("automation_rules")
      .select("*")
      .eq("org_id", orgId)
      .eq("trigger", trigger)
      .eq("enabled", true),
    supabase
      .from("organisations")
      .select("name, logo_url, accent_color, from_email")
      .eq("id", orgId)
      .single(),
  ]);

  if (!rules?.length || !orgRow) return;

  const orgName = orgRow.name;
  const logoUrl = orgRow.logo_url ? orgRow.logo_url.split("?")[0] : null;
  const accentColor = orgRow.accent_color ?? "#111827";

  // Fetch org owner email only if needed
  let ownerEmail: string | null = null;
  let ownerFirstName: string | null = null;
  const needsOwner = rules.some((r) => r.action_type === "notify_owner");
  if (needsOwner) {
    const { data: members } = await supabase
      .from("org_members")
      .select("user_id, profiles(first_name)")
      .eq("org_id", orgId)
      .eq("role", "owner")
      .limit(1);
    const owner = members?.[0];
    if (owner?.user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(owner.user_id);
      ownerEmail = authUser?.user?.email ?? null;
      const profile = Array.isArray(owner.profiles) ? owner.profiles[0] : owner.profiles;
      ownerFirstName = (profile as { first_name?: string | null } | null)?.first_name?.trim() || null;
    }
  }

  await Promise.allSettled(
    rules.map(async (rule: AutomationRule) => {
      if (!meetsConditions(rule.conditions, payload)) return;

      // Client emails greet the client; owner notifications greet the owner.
      const recipientName =
        rule.action_type === "notify_owner" ? (ownerFirstName ?? "there") : (payload.client_name ?? "there");
      const subject = interpolate(rule.action_config.subject ?? "Notification from {{org_name}}", payload, orgName, recipientName);
      const body = interpolate(rule.action_config.body ?? "", payload, orgName, recipientName);
      const ctaUrl = payload.pay_url;

      let sent = false;

      if (rule.action_type === "send_client_email" && payload.client_email) {
        const result = await sendTransactionalEmail({
          orgId,
          invoiceId: payload.invoice_id,
          to: payload.client_email,
          subject,
          templateName: `automation-${rule.id}`,
          fromEmail: (orgRow as { from_email?: string | null }).from_email,
          react: createElement(AutomationEmail, {
            recipientName,
            orgName,
            logoUrl,
            accentColor,
            subject,
            body,
            ctaUrl,
            ctaLabel: ctaUrl ? "View invoice" : undefined,
          }),
        });
        sent = result.ok;
      } else if (rule.action_type === "notify_owner" && ownerEmail) {
        const result = await sendTransactionalEmail({
          orgId,
          invoiceId: payload.invoice_id,
          to: ownerEmail,
          subject,
          templateName: `automation-owner-${rule.id}`,
          fromEmail: (orgRow as { from_email?: string | null }).from_email,
          react: createElement(AutomationEmail, {
            recipientName,
            orgName,
            logoUrl,
            accentColor,
            subject,
            body,
          }),
        });
        sent = result.ok;
      }

      if (sent) {
        await supabase
          .from("automation_rules")
          .update({ run_count: rule.run_count + 1, last_run_at: new Date().toISOString() })
          .eq("id", rule.id);
      }
    })
  );
}
