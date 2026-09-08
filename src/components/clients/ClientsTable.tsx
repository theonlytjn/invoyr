"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
import { useRowSelection } from "@/hooks/useRowSelection";
import { MAX_BULK_IDS } from "@/lib/bulk-actions";
import type { Client } from "@/lib/supabase/types";

interface Props {
  clients: Client[];
  showArchived: boolean;
}

export default function ClientsTable({ clients, showArchived }: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const selection = useRowSelection();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

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

  const filteredIds = filtered.map((c) => c.id);
  const selectedIds = clients.filter((c) => selection.isSelected(c.id)).map((c) => c.id);

  // "Select all" is bounded by the same cap the bulk routes enforce. None of these
  // lists paginate, so on a large org an uncapped select-all would build a request
  // the server rejects with a bare "Invalid request" and no explanation.
  const [selectAllCapped, setSelectAllCapped] = useState(false);
  const selectableIds = filteredIds.slice(0, MAX_BULK_IDS);
  const selectionNote =
    selectAllCapped && selection.count >= MAX_BULK_IDS ? `First ${MAX_BULK_IDS} selected` : undefined;

  function handleSelectAll() {
    setSelectAllCapped(!selection.allSelected(selectableIds) && filteredIds.length > MAX_BULK_IDS);
    selection.toggleAll(selectableIds);
  }

  function clearSelection() {
    setSelectAllCapped(false);
    selection.clear();
  }

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

      <BulkActionBar count={selection.count} onClear={clearSelection} note={selectionNote}>
        <button
          onClick={() => setDeleteOpen(true)}
          className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </BulkActionBar>

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
                <th className="py-3 pl-5 pr-2 w-8">
                  <RowCheckbox
                    checked={selection.allSelected(selectableIds)}
                    onChange={handleSelectAll}
                    label="Select all"
                  />
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Name</th>
                <th className="hidden sm:table-cell text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Company</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Email</th>
                <th className="hidden md:table-cell text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">VAT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className={`border-b border-neutral-100 dark:border-neutral-800 transition-colors ${
                    selection.isSelected(client.id)
                      ? "bg-neutral-50 dark:bg-neutral-800/60"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <td className="py-3 pl-5 pr-2">
                    <RowCheckbox
                      checked={selection.isSelected(client.id)}
                      onChange={() => selection.toggleOne(client.id)}
                      label={`Select ${client.name}`}
                    />
                  </td>
                  <td className="py-3 px-4">
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

      <BulkDeleteDialog
        open={deleteOpen}
        endpoint="/api/clients/bulk/delete"
        ids={selectedIds}
        noun="client"
        nounPlural="clients"
        onCancel={() => setDeleteOpen(false)}
        onDeleted={(result) => {
          setDeleteOpen(false);
          clearSelection();
          const succeeded = result.succeeded ?? result.deleted;
          showToast(
            `Deleted ${succeeded} client${succeeded !== 1 ? "s" : ""}` +
              (result.skipped > 0 ? `, ${result.skipped} skipped` : "") +
              "."
          );
          router.refresh();
        }}
      />

      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-neutral-950 text-white text-sm font-medium rounded-xl shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
