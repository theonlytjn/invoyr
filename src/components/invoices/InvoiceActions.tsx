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
import RecordPaymentModal from "./RecordPaymentModal";
import type { Invoice } from "@/lib/supabase/types";

interface Props {
  invoice: Invoice;
}

export default function InvoiceActions({ invoice }: Props) {
  const router = useRouter();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

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
    if (res.ok) {
      router.refresh();
    } else {
      const { error } = await res.json();
      alert(error ?? "Failed to send invoice");
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
  const canPay = ["sent", "issued", "overdue"].includes(invoice.status);
  const canVoid = !["paid", "void"].includes(invoice.status);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
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
          {canPay && (
            <DropdownMenuItem onClick={() => setPaymentOpen(true)}>
              <CreditCardIcon size={16} className="mr-2" />
              Record payment
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

      <RecordPaymentModal
        invoice={invoice}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
