import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { WeeklyDigestEmail } from "@/emails/transactional/WeeklyDigestEmail";
import { formatCurrency } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  const weekEnding = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Get all orgs that have at least one real invoice
  const { data: invoiceRows } = await supabase
    .from("invoices")
    .select("org_id")
    .not("status", "in", "(draft)");

  if (!invoiceRows?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const orgIds = [...new Set(invoiceRows.map((r) => r.org_id))];

  // Batch-fetch orgs and owners
  const [{ data: orgs }, { data: ownerMembers }] = await Promise.all([
    supabase
      .from("organisations")
      .select("id, name, currency, accent_color, logo_url")
      .in("id", orgIds),
    supabase
      .from("org_members")
      .select("org_id, user_id, profiles(full_name)")
      .in("org_id", orgIds)
      .eq("role", "owner"),
  ]);

  let sent = 0;

  await Promise.allSettled(
    orgIds.map(async (orgId) => {
      const org = orgs?.find((o) => o.id === orgId);
      const ownerMember = ownerMembers?.find((m) => m.org_id === orgId);
      if (!org || !ownerMember) return;

      // Get owner email from auth
      const { data: authData } = await supabase.auth.admin.getUserById(ownerMember.user_id);
      const ownerEmail = authData?.user?.email;
      if (!ownerEmail) return;

      // Parallel metric queries
      const [{ data: activeInvoices }, { data: payments }, { data: newInvoices }] =
        await Promise.all([
          supabase
            .from("invoices")
            .select("status, total, late_fee_amount, amount_paid, credit_applied")
            .eq("org_id", orgId)
            .in("status", ["sent", "issued", "partial", "overdue"]),
          supabase
            .from("payments")
            .select("amount")
            .eq("org_id", orgId)
            .gte("paid_at", weekAgoStr),
          supabase
            .from("invoices")
            .select("id")
            .eq("org_id", orgId)
            .in("status", ["sent", "issued", "partial", "overdue", "paid"])
            .gte("created_at", weekAgoStr),
        ]);

      // Calculate metrics
      let outstanding = 0;
      let overdueCount = 0;
      let overdueAmount = 0;

      for (const inv of activeInvoices ?? []) {
        const balance =
          inv.total +
          ((inv as { late_fee_amount?: number }).late_fee_amount ?? 0) -
          inv.amount_paid -
          ((inv as { credit_applied?: number }).credit_applied ?? 0);
        outstanding += balance;
        if (inv.status === "overdue") {
          overdueCount++;
          overdueAmount += balance;
        }
      }

      const collectedLastWeek = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
      const issuedLastWeek = newInvoices?.length ?? 0;

      // Skip orgs with nothing to report
      if (outstanding === 0 && collectedLastWeek === 0 && issuedLastWeek === 0) return;

      const ownerProfile = Array.isArray(ownerMember.profiles)
        ? ownerMember.profiles[0]
        : ownerMember.profiles;

      const currency = org.currency ?? "GBP";

      const result = await sendTransactionalEmail({
        orgId,
        to: ownerEmail,
        subject: `Your weekly summary — ${org.name}`,
        templateName: "weekly-digest",
        react: createElement(WeeklyDigestEmail, {
          ownerName: (ownerProfile as { full_name?: string | null } | null)?.full_name ?? "there",
          orgName: org.name,
          accentColor: org.accent_color ?? "#111827",
          outstanding: formatCurrency(outstanding, currency),
          overdueCount,
          overdueAmount: formatCurrency(overdueAmount, currency),
          collectedLastWeek: formatCurrency(collectedLastWeek, currency),
          issuedLastWeek,
          dashboardUrl: `${appUrl}/dashboard`,
          weekEnding,
        }),
      });

      if (result.ok) sent++;
    })
  );

  return NextResponse.json({ sent });
}
