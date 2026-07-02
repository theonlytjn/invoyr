import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { AutomationEmail } from "@/emails/transactional/AutomationEmail";
import type { AutomationRule, AutomationConditions } from "@/lib/supabase/types";

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

function interpolate(template: string, payload: AutomationPayload, orgName: string): string {
  return template
    .replace(/\{\{client_name\}\}/g, payload.client_name ?? "there")
    .replace(/\{\{invoice_number\}\}/g, payload.invoice_number ?? "")
    .replace(/\{\{estimate_number\}\}/g, payload.estimate_number ?? "")
    .replace(/\{\{amount\}\}/g, payload.amount != null ? `${payload.currency ?? ""} ${payload.amount.toFixed(2)}` : "")
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
  const needsOwner = rules.some((r) => r.action_type === "notify_owner");
  if (needsOwner) {
    const { data: members } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "owner")
      .limit(1);
    if (members?.[0]?.user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(members[0].user_id);
      ownerEmail = authUser?.user?.email ?? null;
    }
  }

  await Promise.allSettled(
    rules.map(async (rule: AutomationRule) => {
      if (!meetsConditions(rule.conditions, payload)) return;

      const subject = interpolate(rule.action_config.subject ?? "Notification from {{org_name}}", payload, orgName);
      const body = interpolate(rule.action_config.body ?? "", payload, orgName);
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
            recipientName: payload.client_name ?? "there",
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
            recipientName: orgName,
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
