"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, SendIcon, PencilIcon, CopyIcon, TrashIcon, CheckIcon, XCircleIcon } from "@/components/icons";
import type { Estimate } from "@/lib/supabase/types";

interface Props { estimate: Estimate }

export default function EstimateActions({ estimate }: Props) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);

  const canSend = ["draft", "sent"].includes(estimate.status);
  const canEdit = ["draft", "sent"].includes(estimate.status);
  const canConvert = estimate.status === "approved";
  const canDelete = estimate.status === "draft";

  async function handleSend() {
    setSending(true);
    const res = await fetch(`/api/estimates/${estimate.id}/send`, { method: "POST" });
    if (res.ok) router.refresh();
    else {
      const json = await res.json();
      alert(json.error ?? "Failed to send");
    }
    setSending(false);
  }

  async function handleConvert() {
    setConverting(true);
    const res = await fetch(`/api/estimates/${estimate.id}/convert`, { method: "POST" });
    const json = await res.json();
    if (res.ok) router.push(`/invoices/${json.invoice_id}`);
    else {
      alert(json.error ?? "Failed to convert");
      setConverting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this estimate? This cannot be undone.")) return;
    const res = await fetch(`/api/estimates/${estimate.id}`, { method: "DELETE" });
    if (res.ok) router.push("/estimates");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontalIcon size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canSend && (
          <DropdownMenuItem onClick={handleSend} disabled={sending}>
            <SendIcon size={16} className="mr-2" />
            {sending ? "Sending…" : "Send to client"}
          </DropdownMenuItem>
        )}
        {canConvert && (
          <DropdownMenuItem onClick={handleConvert} disabled={converting}>
            <CheckIcon size={16} className="mr-2" />
            {converting ? "Converting…" : "Convert to invoice"}
          </DropdownMenuItem>
        )}
        {canEdit && (
          <DropdownMenuItem onClick={() => router.push(`/estimates/${estimate.id}/edit`)}>
            <PencilIcon size={16} className="mr-2" />
            Edit estimate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
          navigator.clipboard.writeText(`${appUrl}/estimate/${estimate.public_token}`);
        }}>
          <CopyIcon size={16} className="mr-2" />
          Copy link
        </DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
              <TrashIcon size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
