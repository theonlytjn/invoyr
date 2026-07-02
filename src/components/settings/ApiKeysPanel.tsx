"use client";

import { useState } from "react";
import { TrashIcon, CopyIcon, PlusIcon } from "@/components/icons";
import type { ApiKey } from "@/lib/supabase/types";

interface Props {
  initialKeys: Omit<ApiKey, "key_hash">[];
}

export default function ApiKeysPanel({ initialKeys }: Props) {
  const [keys, setKeys] = useState(initialKeys);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ id: string; fullKey: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setKeys((prev) => [data.data, ...prev]);
      setRevealedKey({ id: data.data.id, fullKey: data.fullKey });
      setNewName("");
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this key? Any integrations using it will stop working.")) return;
    const res = await fetch(`/api/developer/keys/${id}`, { method: "DELETE" });
    if (res.ok) setKeys((prev) => prev.map((k) => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
  }

  function copyKey(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);
  const revokedKeys = keys.filter((k) => k.revoked_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">API keys</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Use Bearer tokens to authenticate requests to <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">/api/v1/*</code></p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <PlusIcon size={14} />
            New key
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createKey} className="flex gap-2 p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Key name (e.g. My App)"
            required
            className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-3 py-2 text-sm font-medium bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating…" : "Create"}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors">
            Cancel
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* New key reveal */}
      {revealedKey && (
        <div className="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 space-y-2">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">Key created — copy it now. You won&apos;t see it again.</p>
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            <code className="flex-1 text-xs text-neutral-950 dark:text-neutral-50 break-all">{revealedKey.fullKey}</code>
            <button onClick={() => copyKey(revealedKey.fullKey)} className="shrink-0 text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors">
              <CopyIcon size={14} />
            </button>
          </div>
          {copied && <p className="text-xs text-green-600 dark:text-green-400">Copied to clipboard</p>}
          <button onClick={() => setRevealedKey(null)} className="text-xs text-green-700 dark:text-green-400 hover:underline">
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* Key table */}
      {activeKeys.length === 0 && !showForm ? (
        <p className="text-sm text-neutral-500 py-4 text-center border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
          No active API keys. Create one to get started.
        </p>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">Prefix</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Created</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Last used</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {activeKeys.map((key, i) => (
                <tr key={key.id} className={i < activeKeys.length - 1 ? "border-b border-neutral-100 dark:border-neutral-800" : ""}>
                  <td className="px-4 py-3 font-medium text-neutral-950 dark:text-neutral-50">{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                      {key.key_prefix}…
                    </code>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">
                    {new Date(key.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString("en-GB") : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Revoke key"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {revokedKeys.length > 0 && (
        <p className="text-xs text-neutral-400">{revokedKeys.length} revoked key{revokedKeys.length !== 1 ? "s" : ""} hidden.</p>
      )}
    </div>
  );
}
