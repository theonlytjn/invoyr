"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon, TrashIcon } from "@/components/icons";

interface Connection {
  id: string;
  account_name: string;
  account_type: string | null;
  currency: string;
  last_synced_at: string | null;
  created_at: string;
}

export default function BankConnectionsPanel() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bank/connections");
    const body = await res.json();
    setConnections(body.connections ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Disconnect this bank account? Existing imported expenses will not be affected.")) return;
    setRemovingId(id);
    await fetch(`/api/bank/connections/${id}`, { method: "DELETE" });
    setConnections((prev) => prev.filter((c) => c.id !== id));
    setRemovingId(null);
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">Connected accounts</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Bank accounts linked via Open Banking. Transactions are pulled and matched to expenses.
          </p>
        </div>
        <a
          href="/api/bank/connect"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          <PlusIcon size={13} /> Connect bank
        </a>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-neutral-400">Loading…</div>
      ) : connections.length === 0 ? (
        <div className="py-12 text-center px-6">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">No accounts connected</p>
          <p className="text-sm text-neutral-400 mb-5">
            Connect your business bank account to automatically import transactions into expenses.
          </p>
          <a
            href="/api/bank/connect"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <PlusIcon size={15} /> Connect bank account
          </a>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {connections.map((conn) => (
            <div key={conn.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50">{conn.account_name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {conn.account_type ?? "Account"} · {conn.currency}
                  {conn.last_synced_at
                    ? ` · Last synced ${new Date(conn.last_synced_at).toLocaleDateString("en-GB")}`
                    : " · Never synced"}
                </p>
              </div>
              <button
                onClick={() => remove(conn.id)}
                disabled={removingId === conn.id}
                className="p-1.5 rounded text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                title="Disconnect"
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
        <p className="text-xs text-neutral-400">
          Powered by <strong className="text-neutral-500">TrueLayer Open Banking</strong> — read-only access to your transaction data.
          We never store your banking credentials.
        </p>
      </div>
    </div>
  );
}
