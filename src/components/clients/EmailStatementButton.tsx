"use client";

import { useState } from "react";

interface Props {
  clientId: string;
  clientEmail: string | null;
}

export default function EmailStatementButton({ clientId, clientEmail }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  if (!clientEmail) return null;

  async function handleSend() {
    setState("loading");
    const res = await fetch(`/api/clients/${clientId}/statement/email`, { method: "POST" });
    if (res.ok) {
      setState("sent");
      setTimeout(() => setState("idle"), 3500);
    } else {
      setState("error");
      setTimeout(() => setState("idle"), 3500);
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={state === "loading"}
      className="px-3.5 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
    >
      {state === "loading" && "Sending…"}
      {state === "sent" && "Statement sent!"}
      {state === "error" && "Failed — retry"}
      {state === "idle" && "Email statement"}
    </button>
  );
}
