"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-10 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow";

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
            <div className="mb-8">
              <h1 className="text-3xl font-serif text-neutral-950 mb-2">Set new password</h1>
              <p className="text-sm text-neutral-500">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-950">New password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  {password && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm" className="block text-sm font-medium text-neutral-950">Confirm password</label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your new password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                  />
                  {confirm && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update password"}
              </button>

              <p className="text-center text-sm text-neutral-500">
                <Link href="/login" className="font-medium text-neutral-950 underline underline-offset-4 hover:no-underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          </div>
        </div>

        <footer className="px-8 py-6">
          <p className="text-xs text-neutral-500 text-center">
            &copy; {new Date().getFullYear()} Invoyr. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Right: dark panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-neutral-950 px-16 pt-20 pb-0 overflow-hidden">
        <div className="max-w-md mb-10">
          <h2 className="text-5xl font-serif text-white leading-tight mb-4">
            Get paid faster with professional invoicing
          </h2>
          <p className="text-lg text-neutral-400">
            Create invoices, accept payments, and manage your clients — all in one place.
          </p>
        </div>

        <div className="relative flex-1 rounded-t-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
          <Image
            src="/login.png"
            alt="Invoyr dashboard preview"
            fill
            className="object-cover object-top"
            priority
          />
        </div>
      </div>
    </div>
  );
}
