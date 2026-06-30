import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { computeTotals } from "@/lib/invoice-totals";
import { formatCurrency, formatDate } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import InvoiceActions from "@/components/invoices/InvoiceActions";
import CopyPaymentLink from "@/components/invoices/CopyPaymentLink";
import { TEMPLATE_MAP } from "@/components/invoice-templates";
import type { Metadata } from "next";
import InvoiceAttachments from "@/components/invoices/InvoiceAttachments";
import type { Invoice, InvoiceItem, Client, CreditNote, InvoiceAttachment } from "@/lib/supabase/types";

const ACTION_LABELS: Record<string, string> = {
  "invoice.created": "Invoice created",
  "invoice.issued": "Issued",
  "invoice.sent": "Sent to client",
  "invoice.viewed": "Viewed by client",
  "invoice.paid": "Marked as paid",
  "invoice.voided": "Voided",
  "invoice.overdue": "Marked overdue",
  "payment.recorded": "Payment recorded",
  "invoice.reminder_sent": "Reminder sent",
  "invoice.credit_note_issued": "Credit note issued",
};

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${id.slice(0, 8)}` };
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const [{ data }, { data: auditLogs }, { data: emailLogs }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, clients(*), invoice_items(*)")
      .eq("id", id)
      .eq("org_id", org.id)
      .single(),
    supabase
      .from("audit_logs")
      .select("action, created_at, meta")
      .eq("org_id", org.id)
      .eq("entity_type", "invoice")
      .eq("entity_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("email_logs")
      .select("opened_at, template_name")
      .eq("invoice_id", id)
      .not("opened_at", "is", null)
      .order("opened_at", { ascending: true }),
  ]);

  const [{ data: creditNotes }, { data: attachments }] = await Promise.all([
    supabase
      .from("credit_notes")
      .select("id, credit_note_number, amount, reason, issued_at")
      .eq("invoice_id", id)
      .eq("org_id", org.id)
      .eq("status", "issued")
      .order("issued_at", { ascending: true }),
    supabase
      .from("invoice_attachments")
      .select("*")
      .eq("invoice_id", id)
      .eq("org_id", org.id)
      .order("created_at", { ascending: true }),
  ]);

  if (!data) notFound();

  const invoice = data as unknown as Invoice & {
    invoice_items: InvoiceItem[];
    clients: Client | Client[] | null;
  };

  const items: InvoiceItem[] = invoice.invoice_items ?? [];
  const client: Client | null = Array.isArray(invoice.clients)
    ? (invoice.clients[0] ?? null)
    : invoice.clients ?? null;

  const totals = computeTotals(
    items.map((i) => ({
      description: "",
      quantity: i.quantity,
      unit_price: i.unit_price,
      vat_rate: i.vat_rate,
    }))
  );

  const Template = TEMPLATE_MAP[invoice.template] ?? TEMPLATE_MAP.tjn_classic;

  // Merge audit log entries with email open events into a single sorted timeline.
  // Email opens that already have an audit_log entry (invoice.viewed) are deduplicated
  // by checking whether an audit entry exists within 60 seconds of the open timestamp.
  const auditViewedTimes = new Set(
    (auditLogs ?? [])
      .filter((l) => l.action === "invoice.viewed")
      .map((l) => Math.floor(new Date(l.created_at).getTime() / 60000))
  );

  const emailOpenEvents = (emailLogs ?? [])
    .filter((e) => {
      const bucket = Math.floor(new Date(e.opened_at!).getTime() / 60000);
      return !auditViewedTimes.has(bucket);
    })
    .map((e) => ({
      action: "invoice.viewed",
      created_at: e.opened_at!,
      meta: null as null,
    }));

  const timeline = [...(auditLogs ?? []), ...emailOpenEvents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div>
      <Topbar
        title={invoice.invoice_number}
        actions={
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge status={invoice.status} />
            <Link
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Download PDF
            </Link>
            <InvoiceActions invoice={invoice} clientEmail={client?.email ?? null} />
          </div>
        }
      />

      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 overflow-auto border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
          <div style={{ transform: "scale(0.8)", transformOrigin: "top left", width: "794px" }}>
            <Template
              invoice={invoice}
              items={items}
              client={client}
              org={org}
              totals={{ subtotal: totals.subtotal, vatAmount: totals.vat_amount, discount: totals.discount, total: totals.total }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
            <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base">Invoice summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Status</dt>
                <dd><InvoiceStatusBadge status={invoice.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Issued</dt>
                <dd className="text-neutral-950 dark:text-neutral-50">{formatDate(invoice.issue_date)}</dd>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Due</dt>
                  <dd className="text-neutral-950 dark:text-neutral-50">{formatDate(invoice.due_date)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(invoice.subtotal, invoice.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">VAT</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(invoice.vat_amount, invoice.currency)}</dd>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <dt>Discount</dt>
                  <dd>−{formatCurrency(invoice.discount, invoice.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <dt className="dark:text-neutral-50">Total</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(invoice.total, invoice.currency)}</dd>
              </div>
              {(invoice.late_fee_amount ?? 0) > 0 && (
                <div className="flex justify-between text-orange-600 dark:text-orange-400">
                  <dt>Late fee</dt>
                  <dd>+{formatCurrency(invoice.late_fee_amount, invoice.currency)}</dd>
                </div>
              )}
              {(invoice.credit_applied ?? 0) > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <dt>Credit applied</dt>
                  <dd>−{formatCurrency(invoice.credit_applied, invoice.currency)}</dd>
                </div>
              )}
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between text-green-700 dark:text-green-400">
                  <dt>Paid</dt>
                  <dd>{formatCurrency(invoice.amount_paid, invoice.currency)}</dd>
                </div>
              )}
              {(() => {
                const balanceDue = invoice.total + (invoice.late_fee_amount ?? 0) - invoice.amount_paid - (invoice.credit_applied ?? 0);
                return balanceDue > 0.001 ? (
                  <div className="flex justify-between font-semibold text-orange-600 dark:text-orange-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <dt>Balance due</dt>
                    <dd>{formatCurrency(balanceDue, invoice.currency)}</dd>
                  </div>
                ) : null;
              })()}
            </dl>
          </div>

          {invoice.public_token && invoice.status !== "void" && (
            <CopyPaymentLink url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io"}/pay/${invoice.public_token}`} />
          )}

          {client && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-2">
              <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base">Client</h3>
              <div className="text-sm">
                <p className="font-medium text-neutral-950 dark:text-neutral-50">{client.name}</p>
                {client.company_name && <p className="text-neutral-500 dark:text-neutral-400">{client.company_name}</p>}
                {client.email && <p className="text-neutral-500 dark:text-neutral-400">{client.email}</p>}
              </div>
              <Link href={`/clients/${client.id}`} className="text-sm text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50">
                View client →
              </Link>
            </div>
          )}

          {(creditNotes ?? []).length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
              <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base">Credit notes</h3>
              <ul className="space-y-2">
                {(creditNotes as Pick<CreditNote, "id" | "credit_note_number" | "amount" | "reason" | "issued_at">[]).map((cn) => (
                  <li key={cn.id} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">{cn.credit_note_number}</p>
                      {cn.reason && <p className="text-neutral-500 dark:text-neutral-400 text-xs">{cn.reason}</p>}
                      <time className="text-xs text-neutral-400 dark:text-neutral-500">
                        {new Date(cn.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      −{formatCurrency(cn.amount, invoice.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <InvoiceAttachments
            invoiceId={id}
            orgId={org.id}
            initialAttachments={(attachments ?? []) as InvoiceAttachment[]}
          />

          {timeline.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
              <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base mb-4">History</h3>
              <ol className="relative border-l border-neutral-200 dark:border-neutral-700 space-y-4 ml-1">
                {timeline.map((log, i) => (
                  <li key={i} className="pl-4">
                    <span className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white dark:border-neutral-900 ${log.action === "invoice.viewed" ? "bg-blue-400 dark:bg-blue-500" : "bg-neutral-300 dark:bg-neutral-600"}`} />
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    {log.meta && typeof log.meta === "object" && "amount" in log.meta && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {(log.meta as { credit_note_number?: string }).credit_note_number && (
                          <span className="mr-1">{(log.meta as { credit_note_number: string }).credit_note_number} ·</span>
                        )}
                        {formatCurrency((log.meta as { amount: number }).amount, invoice.currency)}
                        {(log.meta as { method?: string }).method ? ` via ${(log.meta as { method: string }).method.replace("_", " ")}` : ""}
                      </p>
                    )}
                    <time className="text-xs text-neutral-400 dark:text-neutral-500">
                      {new Date(log.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
