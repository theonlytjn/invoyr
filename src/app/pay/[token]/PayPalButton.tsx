"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  token: string;
  currency: string;
  accentColor: string;
  onSuccess: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paypal?: any;
  }
}

export default function PayPalButton({ token, currency, accentColor, onSuccess }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PayPal is not configured.");
      setLoading(false);
      return;
    }

    const scriptId = "paypal-sdk";
    const existing = document.getElementById(scriptId);

    function renderButtons() {
      if (!window.paypal || !containerRef.current || rendered.current) return;
      rendered.current = true;
      setLoading(false);

      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay",
            height: 44,
          },
          createOrder: async () => {
            const res = await fetch(`/api/pay/${token}/paypal`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to create order");
            return data.id;
          },
          onApprove: async (data: { orderID: string }) => {
            const res = await fetch(`/api/pay/${token}/paypal/capture`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await res.json();
            if (!res.ok) {
              setError(result.error ?? "Payment capture failed.");
              return;
            }
            onSuccess();
          },
          onError: () => {
            setError("PayPal encountered an error. Please try again.");
          },
          onCancel: () => {
            // user cancelled — no action needed
          },
        })
        .render(containerRef.current);
    }

    if (existing) {
      if (window.paypal) renderButtons();
      else existing.addEventListener("load", renderButtons);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency.toUpperCase()}&intent=capture`;
    script.addEventListener("load", renderButtons);
    script.addEventListener("error", () => {
      setError("Failed to load PayPal.");
      setLoading(false);
    });
    document.body.appendChild(script);
  }, [token, currency, onSuccess]);

  return (
    <div>
      {loading && (
        <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />
      )}
      {error && (
        <p className="text-sm text-red-600 text-center mt-2">{error}</p>
      )}
      <div ref={containerRef} style={{ display: loading ? "none" : "block" }} />
      {!loading && !error && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Powered by PayPal — your payment goes directly to the recipient
        </p>
      )}
    </div>
  );
}
