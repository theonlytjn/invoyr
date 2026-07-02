"use client";

import { useState } from "react";
import type { Organisation } from "@/lib/supabase/types";

interface Props {
  org: Organisation;
  canCustomBranding: boolean;
  canWhiteLabel: boolean;
}

export default function PortalBrandingPanel({ org, canCustomBranding, canWhiteLabel }: Props) {
  const [tagline, setTagline] = useState(org.portal_tagline ?? "");
  const [supportEmail, setSupportEmail] = useState(org.portal_support_email ?? "");
  const [hideBranding, setHideBranding] = useState(org.hide_invoyr_branding ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagline, supportEmail, hideBranding }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const accentColor = org.accent_color ?? "#111827";

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Portal tagline
          </label>
          <p className="text-xs text-neutral-500 mb-2">
            A short message shown at the bottom of your payment and estimate portal. Leave blank to hide.
          </p>
          {canCustomBranding ? (
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={120}
              placeholder="Questions? Email us at accounts@yourcompany.com"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20"
            />
          ) : (
            <UpgradeLock feature="Custom portal tagline" requiredPlan="Business" />
          )}
        </div>

        {/* Support email */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Support email
          </label>
          <p className="text-xs text-neutral-500 mb-2">
            Shown as a help link on the portal so clients can reach you easily.
          </p>
          {canCustomBranding ? (
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="accounts@yourcompany.com"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20"
            />
          ) : (
            <UpgradeLock feature="Support email on portal" requiredPlan="Business" />
          )}
        </div>

        {/* Remove branding */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
                Remove &ldquo;Powered by Invoyr&rdquo; footer
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Hide the Invoyr branding from all client-facing portals. Pro plan only.
              </p>
            </div>
            {canWhiteLabel ? (
              <button
                type="button"
                role="switch"
                aria-checked={hideBranding}
                onClick={() => setHideBranding((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950/20 ${
                  hideBranding ? "bg-neutral-950 dark:bg-neutral-50" : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white dark:bg-neutral-950 shadow ring-0 transition-transform ${
                    hideBranding ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            ) : (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
                Pro
              </span>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || (!canCustomBranding && !canWhiteLabel)}
            className="px-5 py-2.5 rounded-xl bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
        </div>
      </form>

      {/* Live preview */}
      {canCustomBranding && (
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Portal preview</p>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden max-w-sm">
            <div className="p-4 text-white text-sm font-semibold" style={{ backgroundColor: accentColor }}>
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-10 h-10 object-contain bg-white rounded mb-2" style={{ padding: 2 }} />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded mb-2 flex items-center justify-center text-base font-bold">
                  {org.name?.[0]}
                </div>
              )}
              {org.name}
            </div>
            <div className="p-4 bg-white dark:bg-neutral-900 text-xs text-neutral-500 space-y-1">
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
              <div className="h-8 rounded-lg mt-3" style={{ backgroundColor: accentColor, opacity: 0.9 }} />
            </div>
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 text-center space-y-1">
              {tagline && (
                <p className="text-xs text-neutral-500">{tagline}</p>
              )}
              {supportEmail && (
                <p className="text-xs text-neutral-400">
                  Need help?{" "}
                  <span className="underline" style={{ color: accentColor }}>{supportEmail}</span>
                </p>
              )}
              {!hideBranding && (
                <p className="text-xs text-neutral-400">Powered by Invoyr</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UpgradeLock({ feature, requiredPlan }: { feature: string; requiredPlan: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-neutral-400 shrink-0">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p className="text-sm text-neutral-500 flex-1">
        {feature} requires the <span className="font-medium text-neutral-700 dark:text-neutral-300">{requiredPlan}</span> plan.
      </p>
      <a
        href="/settings/billing"
        className="text-xs font-medium text-neutral-950 dark:text-neutral-50 hover:underline shrink-0"
      >
        Upgrade
      </a>
    </div>
  );
}
