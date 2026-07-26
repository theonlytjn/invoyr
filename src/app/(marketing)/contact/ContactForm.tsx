"use client";

import { useState } from "react";

const inputCls =
  "w-full rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3.5 py-3 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand";
const labelCls = "block text-base text-neutral-700 dark:text-neutral-300 mb-1.5";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="py-10 text-center">
        <div className="w-11 h-11 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-600 dark:text-emerald-400 text-lg" aria-hidden>✓</span>
        </div>
        <p className="text-lg text-neutral-900 dark:text-neutral-100">Message sent</p>
        <p className="text-base text-neutral-500 dark:text-neutral-400 mt-1">We&apos;ll reply within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelCls}>Your name</label>
          <input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Email address</label>
          <input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div>
        <label htmlFor="message" className={labelCls}>Message</label>
        <textarea id="message" rows={5} className={`${inputCls} resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>
      {status === "error" && (
        <p className="text-base text-red-600 dark:text-red-400">Something went wrong. Please email us directly at hello@invoyr.io.</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="px-5 py-3 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-base font-medium hover:bg-neutral-800 dark:hover:bg-white transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
