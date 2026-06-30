"use client";

import { useState } from "react";
import { PaypalLogo } from "@phosphor-icons/react";

interface Props {
  orgId: string;
  initialEmail: string | null;
}

export function PayPalSettingsPanel({ orgId, initialEmail }: Props) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/settings/paypal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paypalEmail: email.trim() || null }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to save.");
    }
  }

  const connected = !!initialEmail;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#003087" }}>
          <PaypalLogo size={20} color="white" weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">PayPal</span>
            {connected && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">Connected</span>
            )}
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Enter your PayPal email address. Clients who pay via PayPal will send funds directly to this account.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          PayPal email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@paypal.com"
          className="w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Leave blank to disable PayPal payments.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">Saved</span>
        )}
      </div>
    </form>
  );
}
