"use client";

import { useState } from "react";

interface Props {
  invoiceId: string;
  accentColor: string;
}

export default function PayButton({ invoiceId, accentColor }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: accentColor }}
    >
      {loading ? "Redirecting…" : "Pay now"}
    </button>
  );
}
