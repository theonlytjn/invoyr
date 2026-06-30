"use client";

import { useState } from "react";
import type { Organisation } from "@/lib/supabase/types";

interface Props {
  org: Pick<Organisation, "smtp_host" | "smtp_port" | "smtp_user" | "smtp_password" | "smtp_from_name" | "smtp_from_email">;
}

export default function SmtpSettingsPanel({ org }: Props) {
  const [host, setHost] = useState(org.smtp_host ?? "");
  const [port, setPort] = useState(String(org.smtp_port ?? 587));
  const [user, setUser] = useState(org.smtp_user ?? "");
  const [password, setPassword] = useState(org.smtp_password ?? "");
  const [fromName, setFromName] = useState(org.smtp_from_name ?? "");
  const [fromEmail, setFromEmail] = useState(org.smtp_from_email ?? "");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isConfigured = !!(org.smtp_host && org.smtp_user && org.smtp_from_email);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch("/api/settings/smtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtp_host: host || null,
        smtp_port: port ? Number(port) : null,
        smtp_user: user || null,
        smtp_password: password || null,
        smtp_from_name: fromName || null,
        smtp_from_email: fromEmail || null,
      }),
    });
    const json = await res.json();
    setSaving(false);
    setSaveMsg(res.ok ? { ok: true, text: "SMTP settings saved." } : { ok: false, text: json.error ?? "Save failed." });
  }

  async function handleTest() {
    setTesting(true);
    setTestMsg(null);
    const res = await fetch("/api/settings/smtp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtp_host: host,
        smtp_port: Number(port),
        smtp_user: user,
        smtp_password: password,
        smtp_from_name: fromName,
        smtp_from_email: fromEmail,
      }),
    });
    const json = await res.json();
    setTesting(false);
    setTestMsg(res.ok ? { ok: true, text: "Connection successful." } : { ok: false, text: json.error ?? "Connection failed." });
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">Custom SMTP</h2>
        {isConfigured && (
          <span className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
            Configured
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        Send transactional emails from your own domain via Google Workspace SMTP or any SMTP provider. Leave blank to use the default Resend delivery.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">SMTP host</label>
            <input
              type="text"
              placeholder="smtp.gmail.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Port</label>
            <input
              type="number"
              placeholder="587"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Username</label>
            <input
              type="text"
              placeholder="you@yourdomain.com"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Password / App password</label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">From name</label>
            <input
              type="text"
              placeholder="Your Business Name"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">From email</label>
            <input
              type="email"
              placeholder="invoices@yourdomain.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
        </div>

        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          For Gmail / Google Workspace: use <code className="font-mono">smtp.gmail.com</code>, port <code className="font-mono">587</code>, and an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="underline">App Password</a> (not your regular password).
        </p>

        {testMsg && (
          <p className={`text-sm ${testMsg.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {testMsg.text}
          </p>
        )}

        {saveMsg && (
          <p className={`text-sm ${saveMsg.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {saveMsg.text}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-neutral-950 dark:bg-neutral-50 px-4 py-2 text-sm font-medium text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          <button
            type="button"
            disabled={testing || !host || !user || !password || !fromEmail}
            onClick={handleTest}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
        </div>
      </form>
    </div>
  );
}
