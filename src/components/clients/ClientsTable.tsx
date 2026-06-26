"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { Client } from "@/lib/supabase/types";

interface Props {
  clients: Client[];
  showArchived: boolean;
}

export default function ClientsTable({ clients, showArchived }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? clients.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.company_name ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q)
        );
      })
    : clients;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          type="search"
          placeholder="Search clients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Link
          href={showArchived ? "/clients" : "/clients?archived=1"}
          className="text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 whitespace-nowrap"
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </Link>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        {!filtered.length ? (
          <div className="text-center py-16">
            {query ? (
              <p className="text-neutral-500">No clients match &ldquo;{query}&rdquo;.</p>
            ) : (
              <>
                <p className="text-neutral-500 mb-3">
                  {showArchived ? "No archived clients." : "No clients yet."}
                </p>
                {!showArchived && (
                  <Link href="/clients/new" className="text-sm font-medium text-neutral-950 dark:text-neutral-50 underline">
                    Add your first client
                  </Link>
                )}
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 dark:border-neutral-800">
              <tr>
                <th className="text-left py-3 px-5 text-xs font-medium text-neutral-500 uppercase tracking-wide">Name</th>
                <th className="hidden sm:table-cell text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Company</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Email</th>
                <th className="hidden md:table-cell text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">VAT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <td className="py-3 px-5">
                    <Link href={`/clients/${client.id}`} className="font-medium text-neutral-950 dark:text-neutral-50 hover:underline">
                      {client.name}
                    </Link>
                    {client.archived && (
                      <span className="ml-2 text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">Archived</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell py-3 px-4 text-neutral-600 dark:text-neutral-400">{client.company_name ?? "—"}</td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 max-w-[140px] truncate">{client.email ?? "—"}</td>
                  <td className="hidden md:table-cell py-3 px-4 text-neutral-500 dark:text-neutral-400 font-mono text-xs">{client.vat_number ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
