"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
import type { Client } from "@/lib/supabase/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  /** Receives the inserted row so the caller can select it straight away. */
  onCreated: (client: Client) => void;
}

/**
 * The minimum a client needs to be invoiced: who they are and where the
 * invoice goes. Everything else (address, VAT, notes) is edited later on the
 * client's own page, so billing isn't blocked on details the sender may not
 * have yet. Email is required here, unlike the full form, because a client
 * created mid-invoice exists to be sent one.
 */
export default function ClientQuickCreateDialog({ open, onOpenChange, orgId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setCompany("");
      setEmail("");
      setError(null);
      setSaving(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("clients")
      .insert({
        org_id: orgId,
        name: name.trim(),
        company_name: company.trim() || null,
        email: email.trim(),
      })
      .select()
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Couldn't save this client. Please try again.");
      setSaving(false);
      return;
    }

    onCreated(data as Client);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New client</DialogTitle>
            <DialogDescription>
              Just the essentials — you can add addresses and VAT details later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="quick-client-name">Contact name *</Label>
              <Input
                id="quick-client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tom Young"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-client-company">
                Company name <span className="font-normal text-neutral-500">(optional)</span>
              </Label>
              <Input
                id="quick-client-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Secure Business Finance"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-client-email">Email *</Label>
              <Input
                id="quick-client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tom@example.com"
                required
                aria-describedby="quick-client-email-hint"
              />
              <p id="quick-client-email-hint" className="text-xs text-neutral-500">
                Where this client's invoices will be sent.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !email.trim()}>
              {saving ? "Saving…" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
