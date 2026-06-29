"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import type { Organisation } from "@/lib/supabase/types";

const ALL_REMINDER_DAYS = [3, 7, 14, 21, 30];
const ALL_PRE_DUE_DAYS = [1, 3, 7];

interface Props {
  org: Organisation;
  canCustomEmail: boolean;
  canReminderAutomation: boolean;
}

export default function EmailSettingsForm({ org, canCustomEmail, canReminderAutomation }: Props) {
  const [fromEmail, setFromEmail] = useState(org.from_email ?? "");
  const [reminderDays, setReminderDays] = useState<number[]>(org.reminder_days ?? ALL_REMINDER_DAYS);
  const [preDueDays, setPreDueDays] = useState<number[]>(org.payment_reminder_days ?? [3]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  function togglePreDueDay(day: number) {
    setPreDueDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: saveErr } = await supabase
      .from("organisations")
      .update({
        from_email: fromEmail || null,
        reminder_days: reminderDays.length > 0 ? reminderDays : ALL_REMINDER_DAYS,
        payment_reminder_days: preDueDays,
      })
      .eq("id", org.id);
    setSaving(false);
    if (saveErr) {
      setError(saveErr.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-white mb-1">Email settings</h2>
        <p className="text-sm text-neutral-500">Control how invoices and reminders are sent.</p>
      </div>

      {/* Custom email domain */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
            Custom send-from email
          </h3>
          {!canCustomEmail && (
            <Link href="/settings/billing" className="text-xs font-medium px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors">
              Pro feature
            </Link>
          )}
        </div>
        {canCustomEmail ? (
          <div className="space-y-1.5">
            <Label htmlFor="fromEmail">Send invoices from</Label>
            <Input
              id="fromEmail"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="invoices@yourcompany.com"
            />
            <p className="text-xs text-neutral-500">
              Your domain must be verified with our email provider. Contact{" "}
              <a href="mailto:support@invoyr.io" className="underline">support@invoyr.io</a>{" "}
              to complete domain setup.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50">
            Invoices are sent from <span className="font-medium text-neutral-700 dark:text-neutral-300">invoices@invoyr.io</span>.{" "}
            Upgrade to Pro to send from your own domain.
          </div>
        )}
      </div>

      {/* Reminder cadence */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
            Overdue reminder schedule
          </h3>
          {!canReminderAutomation && (
            <Link href="/settings/billing" className="text-xs font-medium px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors">
              Pro feature
            </Link>
          )}
        </div>
        {canReminderAutomation ? (
          <div className="space-y-2">
            <p className="text-sm text-neutral-500">Send automatic reminders to clients at these intervals after an invoice becomes overdue:</p>
            <div className="flex flex-wrap gap-2">
              {ALL_REMINDER_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    reminderDays.includes(day)
                      ? "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  Day {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-400">
              Each reminder is sent once. Clients receive an email with a link to pay online.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50">
            Automated overdue reminders are sent to clients at day 3, 7, 14, 21, and 30.{" "}
            Upgrade to Pro to customise the reminder schedule.
          </div>
        )}
      </div>

      {/* Pre-due reminder schedule */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
            Pre-due reminder schedule
          </h3>
          {!canReminderAutomation && (
            <Link href="/settings/billing" className="text-xs font-medium px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors">
              Pro feature
            </Link>
          )}
        </div>
        {canReminderAutomation ? (
          <div className="space-y-2">
            <p className="text-sm text-neutral-500">Send automatic reminders to clients before an invoice is due:</p>
            <div className="flex flex-wrap gap-2">
              {ALL_PRE_DUE_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => togglePreDueDay(day)}
                  className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    preDueDays.includes(day)
                      ? "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {day === 1 ? "1 day before" : `${day} days before`}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-400">
              Reminders are sent once per invoice. Leave all unselected to disable pre-due reminders.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50">
            Upgrade to Pro to send automatic reminders before invoices are due.
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(canCustomEmail || canReminderAutomation) && (
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved && <p className="text-sm text-green-600">Saved!</p>}
        </div>
      )}
    </form>
  );
}
