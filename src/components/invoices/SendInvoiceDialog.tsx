"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  parseRecipientList,
  validateRecipientList,
} from "@/lib/email-recipients";
import { INVOICE_SENT_COPY } from "@/config/email-copy";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  clientEmail: string | null;
  clientCc: string[];
  defaultSubject: string;
  /** Called with who it went to once the email has been sent. */
  onSent: (sent: { to: string; cc: string[] }) => void;
}

/**
 * The compose step before an invoice goes out: who it's to, who's copied, the
 * subject and an optional personal note. The invoice summary, pay button and
 * bank details are always added below the note.
 */
export default function SendInvoiceDialog({
  open,
  onOpenChange,
  ...rest
}: Props) {
  const [sending, setSending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        {/* Mounted only while open, so every send starts from the saved defaults. */}
        {open && (
          <ComposeForm
            {...rest}
            onCancel={() => onOpenChange(false)}
            sending={sending}
            setSending={setSending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ComposeForm({
  invoiceId,
  invoiceNumber,
  clientEmail,
  clientCc,
  defaultSubject,
  onSent,
  onCancel,
  sending,
  setSending,
}: Omit<Props, "open" | "onOpenChange"> & {
  onCancel: () => void;
  sending: boolean;
  setSending: (sending: boolean) => void;
}) {
  const [cc, setCc] = useState(clientCc.join(", "));
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const ccList = parseRecipientList(cc);
    const ccError = validateRecipientList(ccList);
    if (ccError) {
      setError(ccError);
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cc: ccList,
          subject: subject.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          payload?.error ?? "The invoice couldn't be sent. Please try again.",
        );
        return;
      }
      onSent({
        to: payload?.to ?? clientEmail ?? "",
        cc: payload?.cc ?? ccList,
      });
    } catch {
      setError(
        "The invoice couldn't be sent. Check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Send invoice {invoiceNumber}</DialogTitle>
        <DialogDescription>
          Your client gets this email with the invoice summary, a button to view
          and pay, and your bank details if you&apos;ve added them.
        </DialogDescription>
      </DialogHeader>

      {!clientEmail ? (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
        >
          This client has no email address. Add one on the client&apos;s page,
          then send.
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="send-to">To</Label>
            <Input id="send-to" value={clientEmail} readOnly disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="send-cc">
              CC{" "}
              <span className="font-normal text-neutral-400">
                (optional, separate with commas)
              </span>
            </Label>
            <Input
              id="send-cc"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="accounts@client.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="send-subject">Subject</Label>
            <Input
              id="send-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={INVOICE_SENT_COPY.subjectMaxLength}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="send-message">
              Message{" "}
              <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <Textarea
              id="send-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={INVOICE_SENT_COPY.messageMaxLength}
              placeholder="Thanks for your business. Let me know if you have any questions."
            />
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={sending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={sending || !clientEmail}>
          {sending ? "Sending…" : "Send invoice"}
        </Button>
      </DialogFooter>
    </form>
  );
}
