"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(
      form.get("email") as string,
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Left: form */}
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="flex items-center justify-between px-8 py-6">
          <Link href="/">
            <Image src="/main-logo.svg" alt="Invoyr" width={110} height={34} priority />
          </Link>
          <Link href="mailto:hello@invoyr.io" className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors">
            Need help?
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="w-full max-w-sm">
            {sent ? (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h1 className="text-2xl font-serif text-neutral-950 mb-2">Check your inbox</h1>
                <p className="text-sm text-neutral-500 mb-6">
                  We sent a reset link to your email. Click it to choose a new password.
                </p>
                <Link href="/login" className="text-sm font-medium text-neutral-950 underline underline-offset-4">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-serif text-neutral-950 mb-2">Reset your password</h1>
                  <p className="text-sm text-neutral-500">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-950">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending…" : "Send reset link"}
                  </button>

                  <p className="text-center text-sm text-neutral-500">
                    <Link href="/login" className="font-medium text-neutral-950 underline underline-offset-4 hover:no-underline">
                      Back to sign in
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>

        <footer className="px-8 py-6">
          <p className="text-xs text-neutral-500 text-center">
            &copy; {new Date().getFullYear()} Invoyr. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Right: dark panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-neutral-950 p-24 overflow-hidden">
        <div className="max-w-md pt-8">
          <h2 className="text-5xl font-serif text-white leading-tight mb-4">
            Get paid faster with professional invoicing
          </h2>
          <p className="text-lg text-neutral-400">
            Create invoices, accept payments, and manage your clients — all in one place.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { stat: "2 min", label: "Average time to create an invoice" },
            { stat: "48 hrs", label: "Average time to get paid after sending" },
            { stat: "100%", label: "Online, no software to install" },
          ].map(({ stat, label }) => (
            <div key={stat} className="flex items-center gap-4">
              <span className="text-2xl font-serif text-white w-20 shrink-0">{stat}</span>
              <span className="text-sm text-neutral-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
