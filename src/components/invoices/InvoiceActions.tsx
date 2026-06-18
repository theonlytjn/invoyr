"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Download,
  Send,
  CreditCard,
  XCircle,
  Pencil,
} from "lucide-react";
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

  async function handleDownloadPdf() {
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
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

  async function handleVoid() {
    if (!confirm("Are you sure you want to void this invoice? This cannot be undone.")) return;
    const res = await fetch(`/api/invoices/${invoice.id}/void`, { method: "POST" });
    if (res.ok) router.refresh();
  }

  const canSend = ["draft", "issued"].includes(invoice.status);
  const canPay = ["sent", "issued", "overdue"].includes(invoice.status);
  const canVoid = !["paid", "void"].includes(invoice.status);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
          {canSend && (
            <DropdownMenuItem onClick={handleSend} disabled={sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending…" : "Send to client"}
            </DropdownMenuItem>
          )}
          {canPay && (
            <DropdownMenuItem onClick={() => setPaymentOpen(true)}>
              <CreditCard className="w-4 h-4 mr-2" />
              Record payment
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit invoice
          </DropdownMenuItem>
          {canVoid && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleVoid}
                className="text-red-600 focus:text-red-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
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
