"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import type { Client } from "@/lib/supabase/types";

interface Props {
  clients: Client[];
  showArchived: boolean;
}

export default function ClientsTable({ clients, showArchived }: Props) {
  const router = useRouter();
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
          className="text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap"
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!filtered.length ? (
          <div className="text-center py-16">
            {query ? (
              <p className="text-gray-500">No clients match &ldquo;{query}&rdquo;.</p>
            ) : (
              <>
                <p className="text-gray-500 mb-3">
                  {showArchived ? "No archived clients." : "No clients yet."}
                </p>
                {!showArchived && (
                  <Link href="/clients/new" className="text-sm font-medium text-gray-900 underline">
                    Add your first client
                  </Link>
                )}
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">VAT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-5">
                    <Link href={`/clients/${client.id}`} className="font-medium text-gray-900 hover:underline">
                      {client.name}
                    </Link>
                    {client.archived && (
                      <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Archived</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{client.company_name ?? "—"}</td>
                  <td className="py-3 px-4 text-gray-600">{client.email ?? "—"}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs">{client.vat_number ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
