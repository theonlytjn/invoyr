"use client";

import { useState } from "react";
import { TrashIcon, PlusIcon, CheckIcon } from "@/components/icons";
import type { WebhookEndpoint, WebhookEventType } from "@/lib/supabase/types";

const ALL_EVENTS: { value: WebhookEventType; label: string; group: string }[] = [
  { value: "invoice.sent",      label: "Invoice sent",       group: "Invoices" },
  { value: "invoice.paid",      label: "Invoice paid",       group: "Invoices" },
  { value: "invoice.void",      label: "Invoice voided",     group: "Invoices" },
  { value: "invoice.overdue",   label: "Invoice overdue",    group: "Invoices" },
  { value: "estimate.approved", label: "Estimate approved",  group: "Estimates" },
  { value: "estimate.rejected", label: "Estimate rejected",  group: "Estimates" },
  { value: "payment.received",  label: "Payment received",   group: "Payments" },
  { value: "client.created",    label: "Client created",     group: "Clients" },
];

interface Props {
  initialEndpoints: Omit<WebhookEndpoint, "secret">[];
}

export default function WebhooksPanel({ initialEndpoints }: Props) {
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([]);
  const [creating, setCreating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<{ endpointId: string; secret: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEvent(event: WebhookEventType) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  async function createEndpoint(e: React.FormEvent) {
    e.preventDefault();
    if (selectedEvents.length === 0) { setError("Select at least one event"); return; }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: selectedEvents }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEndpoints((prev) => [data.data, ...prev]);
      setRevealedSecret({ endpointId: data.data.id, secret: data.secret });
      setUrl("");
      setSelectedEvents([]);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    const res = await fetch(`/api/developer/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    if (res.ok) setEndpoints((prev) => prev.map((ep) => ep.id === id ? { ...ep, enabled: !enabled } : ep));
  }

  async function deleteEndpoint(id: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    const res = await fetch(`/api/developer/webhooks/${id}`, { method: "DELETE" });
    if (res.ok) setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
  }

  function copySecret(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    });
  }

  const groups = [...new Set(ALL_EVENTS.map((e) => e.group))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">Webhook endpoints</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Invoyr will POST signed JSON to your URLs when events occur.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <PlusIcon size={14} />
            Add endpoint
          </button>
        )}
      </div>

      {/* New endpoint form */}
      {showForm && (
        <form onSubmit={createEndpoint} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Endpoint URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourapp.com/webhooks/invoyr"
              required
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">Events to listen for</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
              {groups.map((group) => (
                <div key={group}>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mt-2 mb-1">{group}</p>
                  {ALL_EVENTS.filter((e) => e.group === group).map((ev) => (
                    <label key={ev.value} className="flex items-center gap-2.5 py-1 cursor-pointer">
                      <div
                        onClick={() => toggleEvent(ev.value)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          selectedEvents.includes(ev.value)
                            ? "bg-neutral-950 dark:bg-neutral-50 border-neutral-950 dark:border-neutral-50"
                            : "border-neutral-300 dark:border-neutral-600"
                        }`}
                      >
                        {selectedEvents.includes(ev.value) && (
                          <CheckIcon size={10} className="text-white dark:text-neutral-950" />
                        )}
                      </div>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{ev.label}</span>
                      <code className="text-xs text-neutral-400 ml-auto">{ev.value}</code>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create endpoint"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Secret reveal */}
      {revealedSecret && (
        <div className="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 space-y-2">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">Signing secret — copy it now. You won&apos;t see it again.</p>
          <p className="text-xs text-green-700 dark:text-green-400">Use this to verify <code>X-Invoyr-Signature</code> headers: HMAC-SHA256 of <code>t.body</code>.</p>
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            <code className="flex-1 text-xs text-neutral-950 dark:text-neutral-50 break-all">{revealedSecret.secret}</code>
            <button onClick={() => copySecret(revealedSecret.secret)} className="shrink-0 text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50">
              <CheckIcon size={14} className={copiedSecret ? "text-green-600" : ""} />
            </button>
          </div>
          <button onClick={() => setRevealedSecret(null)} className="text-xs text-green-700 dark:text-green-400 hover:underline">
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* Endpoint list */}
      {endpoints.length === 0 && !showForm ? (
        <p className="text-sm text-neutral-500 py-4 text-center border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
          No webhook endpoints yet.
        </p>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.id} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50 truncate">{ep.url}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {ep.last_triggered_at
                      ? `Last triggered ${new Date(ep.last_triggered_at).toLocaleDateString("en-GB")}`
                      : "Never triggered"}
                    {ep.failure_count > 0 && (
                      <span className="ml-2 text-orange-600 dark:text-orange-400">{ep.failure_count} failure{ep.failure_count !== 1 ? "s" : ""}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleEnabled(ep.id, ep.enabled)}
                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      ep.enabled ? "bg-neutral-950 dark:bg-neutral-50" : "bg-neutral-200 dark:bg-neutral-700"
                    }`}
                    title={ep.enabled ? "Disable" : "Enable"}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-neutral-950 shadow transition-transform ${ep.enabled ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <button
                    onClick={() => deleteEndpoint(ep.id)}
                    className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(ep.events as WebhookEventType[]).map((event) => (
                  <span key={event} className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full font-mono">
                    {event}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-neutral-400 space-y-1 pt-2">
        <p>Verify webhooks: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">HMAC-SHA256(secret, &quot;t.body&quot;)</code> — check against <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">X-Invoyr-Signature</code></p>
      </div>
    </div>
  );
}
