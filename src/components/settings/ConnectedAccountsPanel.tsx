"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserIdentity } from "@supabase/supabase-js";

export function ConnectedAccountsPanel() {
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIdentities(data.user?.identities ?? []);
    });
  }, []);

  const hasGoogle = identities.some((i) => i.provider === "google");
  const hasEmail  = identities.some((i) => i.provider === "email");

  async function linkGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings/account`,
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
    // On success, browser is redirected to Google — no further action needed here
  }

  return (
    <div className="space-y-3">
      {/* Email / password row */}
      <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-neutral-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Email &amp; password</p>
            <p className="text-xs text-neutral-500">{hasEmail ? "Connected" : "Not connected"}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${hasEmail ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"}`}>
          {hasEmail ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Google row */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            {/* Google "G" icon */}
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Google</p>
            <p className="text-xs text-neutral-500">
              {hasGoogle ? "Connected — you can sign in with Google" : "Connect to sign in with your Google account"}
            </p>
          </div>
        </div>

        {hasGoogle ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Active
          </span>
        ) : (
          <button
            onClick={linkGoogle}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Redirecting…" : "Connect"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 pt-1">{error}</p>
      )}

      {!hasGoogle && (
        <p className="text-xs text-neutral-400 pt-1">
          Connecting Google lets you sign in via either method, useful if you lose access to your password.
          Requires "Enable Manual Linking" to be on in Supabase Auth settings.
        </p>
      )}
    </div>
  );
}
