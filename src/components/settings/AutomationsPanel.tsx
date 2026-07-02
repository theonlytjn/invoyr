"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, PencilIcon } from "@/components/icons";
import type { AutomationRule, AutomationTrigger, AutomationActionType } from "@/lib/supabase/types";

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  "invoice.overdue":   "Invoice becomes overdue",
  "invoice.paid":      "Invoice is paid",
  "invoice.sent":      "Invoice is sent",
  "estimate.approved": "Estimate is approved",
  "estimate.expired":  "Estimate expires",
};

const TRIGGER_COLORS: Record<AutomationTrigger, string> = {
  "invoice.overdue":   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  "invoice.paid":      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  "invoice.sent":      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  "estimate.approved": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  "estimate.expired":  "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
};

const ACTION_LABELS: Record<AutomationActionType, string> = {
  send_client_email: "Send email to client",
  notify_owner:      "Notify me by email",
};

const TEMPLATES: Array<{
  name: string;
  trigger: AutomationTrigger;
  action_type: AutomationActionType;
  conditions: Record<string, unknown>;
  action_config: { subject: string; body: string };
  description: string;
}> = [
  {
    name: "Thank-you email on payment",
    description: "Send the client a thank-you email as soon as their payment is recorded.",
    trigger: "invoice.paid",
    action_type: "send_client_email",
    conditions: {},
    action_config: {
      subject: "Thank you for your payment — Invoice {{invoice_number}}",
      body: "Hi {{client_name}},\n\nThank you for your payment — we really appreciate it.\n\nIf you have any questions, don't hesitate to get in touch.\n\nWarm regards,\n{{org_name}}",
    },
  },
  {
    name: "Owner alert on estimate approval",
    description: "Get notified by email the moment a client approves an estimate.",
    trigger: "estimate.approved",
    action_type: "notify_owner",
    conditions: {},
    action_config: {
      subject: "Estimate {{estimate_number}} approved",
      body: "Good news — your estimate {{estimate_number}} has been approved by {{client_name}}.\n\nLog in to convert it to an invoice.",
    },
  },
  {
    name: "7-day overdue follow-up",
    description: "Automatically chase overdue invoices that are at least 7 days past due.",
    trigger: "invoice.overdue",
    action_type: "send_client_email",
    conditions: { days_overdue_gt: 6 },
    action_config: {
      subject: "Friendly reminder: Invoice {{invoice_number}} is overdue",
      body: "Hi {{client_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for {{amount}} remains unpaid.\n\nPlease arrange payment at your earliest convenience.\n\nThank you,\n{{org_name}}",
    },
  },
  {
    name: "Owner alert on estimate expiry",
    description: "Get notified when an estimate passes its expiry date with no response.",
    trigger: "estimate.expired",
    action_type: "notify_owner",
    conditions: {},
    action_config: {
      subject: "Estimate {{estimate_number}} has expired",
      body: "Your estimate {{estimate_number}} sent to {{client_name}} has passed its expiry date without a response.\n\nYou may want to follow up or create a new one.",
    },
  },
];

const VARIABLE_HINTS = "Available: {{client_name}}, {{invoice_number}}, {{estimate_number}}, {{amount}}, {{org_name}}, {{days_overdue}}";

interface RuleFormData {
  name: string;
  trigger: AutomationTrigger;
  action_type: AutomationActionType;
  conditions: { amount_gt?: string; days_overdue_gt?: string };
  action_config: { subject: string; body: string };
}

const EMPTY_FORM: RuleFormData = {
  name: "",
  trigger: "invoice.overdue",
  action_type: "send_client_email",
  conditions: {},
  action_config: { subject: "", body: "" },
};

interface Props {
  initialRules: AutomationRule[];
}

export default function AutomationsPanel({ initialRules }: Props) {
  const [rules, setRules] = useState(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew(prefill?: Partial<RuleFormData>) {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, ...prefill });
    setError(null);
    setShowForm(true);
  }

  function openEdit(rule: AutomationRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      trigger: rule.trigger,
      action_type: rule.action_type,
      conditions: {
        amount_gt: rule.conditions.amount_gt != null ? String(rule.conditions.amount_gt) : "",
        days_overdue_gt: rule.conditions.days_overdue_gt != null ? String(rule.conditions.days_overdue_gt) : "",
      },
      action_config: { subject: rule.action_config.subject ?? "", body: rule.action_config.body ?? "" },
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      trigger: form.trigger,
      action_type: form.action_type,
      conditions: {
        ...(form.conditions.amount_gt ? { amount_gt: Number(form.conditions.amount_gt) } : {}),
        ...(form.conditions.days_overdue_gt ? { days_overdue_gt: Number(form.conditions.days_overdue_gt) } : {}),
      },
      action_config: form.action_config,
    };

    try {
      const url = editingId ? `/api/automations/${editingId}` : "/api/automations";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      if (editingId) {
        setRules((prev) => prev.map((r) => r.id === editingId ? { ...r, ...payload } : r));
      } else {
        setRules((prev) => [data.data, ...prev]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleRule(id: string, enabled: boolean) {
    const res = await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    if (res.ok) setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !enabled } : r));
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this automation rule?")) return;
    const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
    if (res.ok) setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function applyTemplate(t: typeof TEMPLATES[number]) {
    openNew({
      name: t.name,
      trigger: t.trigger,
      action_type: t.action_type,
      conditions: {
        days_overdue_gt: t.conditions.days_overdue_gt != null ? String(t.conditions.days_overdue_gt) : "",
      },
      action_config: t.action_config,
    });
  }

  const activeRuleKeys = new Set(rules.map((r) => r.name));

  return (
    <div className="space-y-8">
      {/* Starter templates */}
      {TEMPLATES.some((t) => !activeRuleKeys.has(t.name)) && (
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Starter templates</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.filter((t) => !activeRuleKeys.has(t.name)).map((t) => (
              <div
                key={t.name}
                className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 flex flex-col gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIGGER_COLORS[t.trigger]}`}>
                      {TRIGGER_LABELS[t.trigger]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50">{t.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t.description}</p>
                </div>
                <button
                  onClick={() => applyTemplate(t)}
                  className="self-start flex items-center gap-1.5 text-xs font-medium text-neutral-950 dark:text-neutral-50 hover:underline"
                >
                  <PlusIcon size={12} />
                  Add rule
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active rules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {rules.length > 0 ? `${rules.length} rule${rules.length !== 1 ? "s" : ""}` : "Your rules"}
          </p>
          <button
            onClick={() => openNew()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <PlusIcon size={14} />
            Custom rule
          </button>
        </div>

        {rules.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
            No automation rules yet. Add one from the templates above or create a custom rule.
          </p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50">{rule.name}</p>
                    {!rule.enabled && (
                      <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full">
                        Paused
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIGGER_COLORS[rule.trigger as AutomationTrigger]}`}>
                      {TRIGGER_LABELS[rule.trigger as AutomationTrigger] ?? rule.trigger}
                    </span>
                    <span className="text-xs text-neutral-400">→</span>
                    <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full">
                      {ACTION_LABELS[rule.action_type as AutomationActionType] ?? rule.action_type}
                    </span>
                  </div>
                  {rule.run_count > 0 && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Ran {rule.run_count} time{rule.run_count !== 1 ? "s" : ""}
                      {rule.last_run_at && ` · last ${new Date(rule.last_run_at).toLocaleDateString("en-GB")}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleRule(rule.id, rule.enabled)}
                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      rule.enabled ? "bg-neutral-950 dark:bg-neutral-50" : "bg-neutral-200 dark:bg-neutral-700"
                    }`}
                    title={rule.enabled ? "Pause" : "Enable"}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-neutral-950 shadow transition-transform ${rule.enabled ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <button onClick={() => openEdit(rule)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                    <PencilIcon size={15} />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rule form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                {editingId ? "Edit rule" : "New automation rule"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Rule name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  maxLength={100}
                  placeholder="My automation"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Trigger</label>
                <select
                  value={form.trigger}
                  onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value as AutomationTrigger }))}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
                >
                  {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-2 gap-3">
                {form.trigger === "invoice.overdue" && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Only if days overdue &gt;</label>
                    <input
                      type="number"
                      min={0}
                      value={form.conditions.days_overdue_gt ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, conditions: { ...f.conditions, days_overdue_gt: e.target.value } }))}
                      placeholder="e.g. 7"
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Only if amount &gt;</label>
                  <input
                    type="number"
                    min={0}
                    value={form.conditions.amount_gt ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, conditions: { ...f.conditions, amount_gt: e.target.value } }))}
                    placeholder="e.g. 500"
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
                  />
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Action</label>
                <select
                  value={form.action_type}
                  onChange={(e) => setForm((f) => ({ ...f, action_type: e.target.value as AutomationActionType }))}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
                >
                  {Object.entries(ACTION_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Email subject */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email subject</label>
                <input
                  type="text"
                  value={form.action_config.subject}
                  onChange={(e) => setForm((f) => ({ ...f, action_config: { ...f.action_config, subject: e.target.value } }))}
                  required
                  maxLength={200}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
                />
              </div>

              {/* Email body */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email body</label>
                <textarea
                  value={form.action_config.body}
                  onChange={(e) => setForm((f) => ({ ...f, action_config: { ...f.action_config, body: e.target.value } }))}
                  rows={6}
                  maxLength={2000}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 resize-none"
                />
                <p className="text-xs text-neutral-400 mt-1">{VARIABLE_HINTS}</p>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving…" : editingId ? "Save changes" : "Create rule"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
