"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontalIcon,
  DownloadIcon,
  SendIcon,
  CreditCardIcon,
  XCircleIcon,
  PencilIcon,
  CheckIcon,
  CopyIcon,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RecordPaymentModal from "./RecordPaymentModal";
import CreditNoteModal from "./CreditNoteModal";
import type { Invoice } from "@/lib/supabase/types";

interface Props {
  invoice: Invoice;
  clientEmail?: string | null;
}

export default function InvoiceActions({ invoice, clientEmail }: Props) {
  const router = useRouter();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [creditNoteOpen, setCreditNoteOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  // Set once a send succeeds, so the confirmation can name the recipients
  // rather than just silently refreshing the page.
  const [sentTo, setSentTo] = useState<{ to: string; cc: string[] } | null>(null);

  async function handleDownloadPdf() {
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  }

  async function handleIssue() {
    setIssuing(true);
    const res = await fetch(`/api/invoices/${invoice.id}/issue`, { method: "POST" });
    setIssuing(false);
    if (res.ok) {
      router.refresh();
    } else {
      const { error } = await res.json();
      alert(error ?? "Failed to issue invoice");
    }
  }

  async function handleSend() {
    setSending(true);
    const res = await fetch(`/api/invoices/${invoice.id}/send`, { method: "POST" });
    setSending(false);
    const payload = await res.json().catch(() => ({}));

    if (res.ok) {
      setSentTo({ to: payload?.to ?? clientEmail ?? "", cc: payload?.cc ?? [] });
      router.refresh();
    } else {
      alert(payload?.error ?? "Failed to send invoice");
    }
  }

  async function handleRemind() {
    setReminding(true);
    const res = await fetch(`/api/invoices/${invoice.id}/remind`, { method: "POST" });
    setReminding(false);
    if (res.ok) {
      router.refresh();
    } else {
      const { error } = await res.json();
      alert(error ?? "Failed to send reminder");
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    const res = await fetch(`/api/invoices/${invoice.id}/duplicate`, { method: "POST" });
    setDuplicating(false);
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/invoices/${id}`);
    } else {
      const { error } = await res.json();
      alert(error ?? "Failed to duplicate invoice");
    }
  }

  async function handleVoid() {
    if (!confirm("Are you sure you want to void this invoice? This cannot be undone.")) return;
    const res = await fetch(`/api/invoices/${invoice.id}/void`, { method: "POST" });
    if (res.ok) router.refresh();
  }

  const canIssue = invoice.status === "draft";
  const canSend = ["draft", "issued"].includes(invoice.status);
  const canRemind = ["sent", "issued", "overdue"].includes(invoice.status);
  const canPay = ["sent", "issued", "overdue"].includes(invoice.status);
  const canVoid = !["paid", "void"].includes(invoice.status);
  const canCreditNote = ["issued", "sent", "partial", "paid", "overdue"].includes(invoice.status);
  const remainingBalance =
    invoice.total + (invoice.late_fee_amount ?? 0) - invoice.amount_paid - (invoice.credit_applied ?? 0);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Invoice actions">
            <MoreHorizontalIcon size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleDownloadPdf}>
            <DownloadIcon size={16} className="mr-2" />
            Download PDF
          </DropdownMenuItem>
          {canIssue && (
            <DropdownMenuItem onClick={handleIssue} disabled={issuing}>
              <CheckIcon size={16} className="mr-2" />
              {issuing ? "Issuing…" : "Mark as issued"}
            </DropdownMenuItem>
          )}
          {canSend && (
            <DropdownMenuItem onClick={handleSend} disabled={sending}>
              <SendIcon size={16} className="mr-2" />
              {sending ? "Sending…" : "Send to client"}
            </DropdownMenuItem>
          )}
          {canRemind && (
            <DropdownMenuItem onClick={handleRemind} disabled={reminding}>
              <SendIcon size={16} className="mr-2" />
              {reminding ? "Sending…" : "Send reminder"}
            </DropdownMenuItem>
          )}
          {canPay && (
            <DropdownMenuItem onClick={() => setPaymentOpen(true)}>
              <CreditCardIcon size={16} className="mr-2" />
              Record payment
            </DropdownMenuItem>
          )}
          {canCreditNote && remainingBalance > 0 && (
            <DropdownMenuItem onClick={() => setCreditNoteOpen(true)}>
              <CreditCardIcon size={16} className="mr-2" />
              Issue credit note
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
          >
            <PencilIcon size={16} className="mr-2" />
            Edit invoice
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate} disabled={duplicating}>
            <CopyIcon size={16} className="mr-2" />
            {duplicating ? "Duplicating…" : "Duplicate"}
          </DropdownMenuItem>
          {canVoid && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleVoid}
                className="text-red-600 focus:text-red-600"
              >
                <XCircleIcon size={16} className="mr-2" />
                Void invoice
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={Boolean(sentTo)} onOpenChange={(open) => !open && setSentTo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice {invoice.invoice_number} sent</DialogTitle>
            <DialogDescription>
              {sentTo?.to ? `Emailed to ${sentTo.to}.` : "The invoice has been emailed."}
              {sentTo?.cc?.length
                ? ` Copied to ${sentTo.cc.join(", ")}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-neutral-500">
            You&apos;ll see it in this invoice&apos;s history, along with when your client opens it.
          </p>
          <DialogFooter>
            <Button onClick={() => setSentTo(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecordPaymentModal
        invoice={invoice}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => router.refresh()}
      />
      <CreditNoteModal
        invoice={invoice}
        clientEmail={clientEmail ?? null}
        open={creditNoteOpen}
        onClose={() => setCreditNoteOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
