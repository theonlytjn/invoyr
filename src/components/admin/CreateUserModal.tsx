"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onCreated: () => void;
}

export function CreateUserModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", orgName: "" });

  function reset() {
    setForm({ email: "", firstName: "", lastName: "", orgName: "" });
    setError(null);
    setResult(null);
  }

  function close() {
    if (result) onCreated();
    setOpen(false);
    reset();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }

    setResult({ email: form.email, tempPassword: body.tempPassword });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
      >
        Create user
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6">

            {result ? (
              /* Success state */
              <div className="space-y-5">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-green-600 dark:text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">User created</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    A welcome email has been sent to <strong>{result.email}</strong> with their login details.
                  </p>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Temporary password</p>
                  <p className="font-mono text-lg text-neutral-950 dark:text-neutral-50 tracking-wider">{result.tempPassword}</p>
                  <p className="text-xs text-neutral-400">Keep this safe as a backup. The user should change it after first login.</p>
                </div>

                <button
                  onClick={close}
                  className="w-full py-2.5 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form state */
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">Create user</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Creates an account, organisation, and sends login credentials by email.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">First name</label>
                    <input
                      required
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Last name</label>
                    <input
                      required
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Email address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Organisation name</label>
                  <input
                    required
                    value={form.orgName}
                    onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
                    placeholder="e.g. Acme Studio"
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      loading
                        ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
                        : "bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200"
                    )}
                  >
                    {loading ? "Creating…" : "Create user"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
