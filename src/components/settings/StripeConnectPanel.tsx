"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  connected: boolean;
  accountId: string | null;
}

export function StripeConnectPanel({ connected, accountId }: Props) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Disconnect your Stripe account? Clients will no longer be able to pay invoices online until you reconnect.")) return;
    setDisconnecting(true);
    await fetch("/api/stripe/connect/disconnect", { method: "POST" });
    window.location.reload();
  }

  if (connected && accountId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900 dark:text-green-400">Stripe connected</p>
            <p className="text-xs text-green-700 dark:text-green-500 font-mono truncate mt-0.5">{accountId}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href="https://dashboard.stripe.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Open Stripe Dashboard ↗
          </a>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 shrink-0" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">No Stripe account connected</p>
      </div>
      <p className="text-sm text-neutral-500">
        Connect your Stripe account so clients can pay invoices online. Payments go directly to your Stripe balance.
      </p>
      <a
        href="/api/stripe/connect/authorize"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#635BFF] text-white text-sm font-medium rounded-lg hover:bg-[#5851e6] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M13.5 11.5c0-1.1.9-1.8 2.3-1.8 2 0 4.6.7 6.2 1.6V5.2C20.2 4.4 18.3 4 16 4 10.5 4 7 7 7 11.7c0 7.2 9.5 6 9.5 9.1 0 1.3-1.1 1.7-2.6 1.7-2.3 0-5.2-.9-7.4-2.2v6.2c2.5 1.1 5 1.5 7.4 1.5 5.7 0 9.6-2.8 9.6-7.6-.1-7.8-9.5-6.4-9.5-8.9z" fill="white"/>
        </svg>
        Connect with Stripe
      </a>
    </div>
  );
}
