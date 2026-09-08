import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { OverdueReminderEmail } from "@/emails/transactional/OverdueReminderEmail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { orgHasFeature } from "@/lib/billing";
import { partitionRemind, summarise, type RemindRow, type SkipReason } from "@/lib/bulk-actions";

const schema = z.object({
  ids: bulkIdsSchema(),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  // Gated: each call sends real email. Same gate as bulk send and void.
  if (!(await orgHasFeature(org.id, "bulk_invoice_actions"))) {
    return NextResponse.json({ error: "Bulk actions require the Business plan." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    .select("*, clients(*), organisations(name, accent_color, logo_url, from_email)")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const unwrap = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

  const rows: RemindRow[] = (invoices ?? []).map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    status: inv.status,
    clientEmail: unwrap(inv.clients)?.email ?? null,
  }));

  const partition = partitionRemind(rows);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const byId = new Map((invoices ?? []).map((i) => [i.id, i]));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  // `sendTransactionalEmail` doesn't throw on failure (render/SMTP/Resend errors come
  // back as `{ ok: false, error }`), and a network-level exception is possible too. Track
  // per-invoice outcome so the audit trail and the response only ever reflect emails that
  // actually went out, and so one failure can't abort the rest of the batch.
  const sentIds: string[] = [];
  let failed = 0;

  for (const row of partition.deletable) {
    const invoice = byId.get(row.id);
    const client = invoice ? unwrap(invoice.clients) : null;

    if (!invoice || !client?.email) {
      failed++;
      console.error("[bulk] reminder send skipped — invoice or client email missing", {
        invoiceId: row.id,
      });
      continue;
    }

    const orgRow = unwrap(invoice.organisations);

    const payUrl = invoice.public_token ? `${appUrl}/pay/${invoice.public_token}` : appUrl;
    const logoUrl = orgRow?.logo_url ? orgRow.logo_url.split("?")[0] : null;
    const daysOverdue = invoice.due_date
      ? Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86_400_000)
      : null;

    const subject = daysOverdue && daysOverdue > 0
      ? `Reminder: Invoice ${invoice.invoice_number} is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`
      : `Reminder: Invoice ${invoice.invoice_number} is due`;

    try {
      const sendResult = await sendTransactionalEmail({
        orgId: org.id,
        invoiceId: invoice.id,
        to: client.email,
        subject,
        templateName: "overdue-reminder",
        fromEmail: orgRow?.from_email,
        react: createElement(OverdueReminderEmail, {
          clientName: client.name ?? "there",
          orgName: orgRow?.name ?? "",
          logoUrl,
          accentColor: orgRow?.accent_color ?? "#111827",
          invoiceNumber: invoice.invoice_number,
          dueDate: invoice.due_date ? formatDate(invoice.due_date) : "—",
          balanceDue: formatCurrency(
            invoice.total + (invoice.late_fee_amount ?? 0) - invoice.amount_paid,
            invoice.currency
          ),
          payUrl,
        }),
      });

      if (sendResult.ok) {
        sentIds.push(invoice.id);
      } else {
        failed++;
        console.error("[bulk] reminder send failed", {
          invoiceId: invoice.id,
          error: sendResult.error,
        });
      }
    } catch (err) {
      failed++;
      console.error("[bulk] reminder send threw", {
        invoiceId: invoice.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const sentIdSet = new Set(sentIds);
  const sentInvoices = partition.deletable.filter((inv) => sentIdSet.has(inv.id));

  if (sentInvoices.length > 0) {
    const { error: auditError } = await supabase.from("audit_logs").insert(
      sentInvoices.map((inv) => ({
        org_id: org.id,
        user_id: user.id,
        action: "invoice.reminded",
        entity_type: "invoice",
        entity_id: inv.id,
        meta: { invoice_number: inv.invoice_number, bulk: true },
      }))
    );

    if (auditError) {
      console.error("[bulk] audit log write failed", {
        action: "invoice.reminded",
        ids: sentIds,
        error: auditError.message,
      });
    }
  }

  // `result` (from `summarise`) describes eligibility, computed before any send was
  // attempted. Rewrite it to describe delivery: successes are emails that actually went
  // out, and any send that failed moves from "deleted" to "skipped" with its own reason,
  // so `deleted` + every reason's count still sums to the number of ids requested.
  const failureReasons: SkipReason[] =
    failed > 0
      ? [
          {
            count: failed,
            reason: failed === 1 ? "1 reminder could not be sent" : `${failed} reminders could not be sent`,
          },
        ]
      : [];

  return NextResponse.json({
    deleted: sentIds.length,
    skipped: result.skipped + failed,
    reasons: [...result.reasons, ...failureReasons],
  });
}
