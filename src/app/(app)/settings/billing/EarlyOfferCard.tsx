"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  percent: number;
  planName: string;
  /** Normal and discounted first-year prices, already formatted. */
  yearly: string;
  discounted: string;
  /** Formatted last day it can be claimed. */
  closesOn: string;
  trialing: boolean;
}

/** The early adopter's yearly offer, shown in Billing while it can be claimed. */
export function EarlyOfferCard({ percent, planName, yearly, discounted, closesOn, trialing }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/early-offer", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "We couldn't apply the offer. Please try again.");
        return;
      }
      await fetch("/api/billing/sync", { method: "POST" }).catch(() => null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand/50 bg-brand/10 p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-ink">Early adopter offer</p>
      <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">
        {percent}% off your first year of {planName}
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Pay <span className="font-semibold text-neutral-950 dark:text-neutral-50">{discounted}</span>{" "}
        <span className="line-through">{yearly}</span> for your first year, then the normal yearly price.{" "}
        {trialing
          ? "Nothing changes until your trial ends; that's when the discounted year is charged."
          : "Your plan switches to yearly today, with credit for what's left of this month."}{" "}
        Open until {closesOn}.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button onClick={claim} disabled={loading}>
        {loading ? "Applying…" : `Claim ${percent}% off yearly`}
      </Button>
    </div>
  );
}
