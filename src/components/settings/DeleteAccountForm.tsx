"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  email: string;
}

export default function DeleteAccountForm({ email }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to delete account.");
      setLoading(false);
      return;
    }

    // Redirect to homepage after successful deletion
    window.location.href = "/";
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
      >
        Delete my account
      </Button>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
      <p className="text-sm text-red-800">
        This will permanently delete your account ({email}), your organisation, all clients,
        invoices, and payment records. <strong>This cannot be undone.</strong>
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="delete-confirm" className="text-red-700">
          Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm
        </Label>
        <Input
          id="delete-confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="DELETE MY ACCOUNT"
          className="border-red-200 focus:ring-red-500"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => { setOpen(false); setConfirmation(""); setError(null); }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={handleDelete}
          disabled={loading || confirmation !== "DELETE MY ACCOUNT"}
        >
          {loading ? "Deleting…" : "Delete account permanently"}
        </Button>
      </div>
    </div>
  );
}
