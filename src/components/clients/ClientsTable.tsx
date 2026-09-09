"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
import { useRowSelection } from "@/hooks/useRowSelection";
import { MAX_BULK_IDS, selectAllAddition, type BulkActionResult } from "@/lib/bulk-actions";
import type { Client } from "@/lib/supabase/types";

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

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

  // Kept short on purpose — the substance lives in `describeForDelete` below.
  // Personalised by name only for a single selection, where "Delete Acme?" is
  // still short; a plural selection falls back to the plain count.
  function titleForDelete(n: number): string {
    if (n === 1) {
      const only = clients.find((c) => selection.isSelected(c.id));
      if (only) return `Delete ${only.name}?`;
    }
    return `Delete ${pluralize(n, "client", "clients")}?`;
  }

  // Built from BulkDeleteDialog's own dry-run result — no second request. Both
  // truths must appear, and neither may be softened into the other: the
  // documents keep their billing details, and the deletion still cannot be
  // undone. Archive is named as the reversible alternative whenever there is
  // anything linked to lose.
  function describeForDelete(preview: BulkActionResult): string {
    const totals = (preview.clients ?? []).reduce(
      (acc, c) => ({
        invoices: acc.invoices + c.linkedInvoices,
        estimates: acc.estimates + c.linkedEstimates,
        recurring: acc.recurring + c.linkedRecurring,
      }),
      { invoices: 0, estimates: 0, recurring: 0 }
    );

    const sentences: string[] = [];

    if (totals.invoices > 0 || totals.estimates > 0) {
      const linkedText = [
        totals.invoices > 0 ? pluralize(totals.invoices, "invoice", "invoices") : null,
        totals.estimates > 0 ? pluralize(totals.estimates, "estimate", "estimates") : null,
      ]
        .filter((part): part is string => part !== null)
        .join(" and ");
      const docWord = totals.invoices + totals.estimates === 1 ? "document" : "documents";
      sentences.push(
        `${linkedText} will keep the client's billing details, but the ${docWord} will no longer be linked to a client record.`
      );
    }

    // Recurring schedules are the one linked record that keeps generating work
    // after the client is gone, so the warning has to name the consequence, not
    // just the count.
    if (totals.recurring > 0) {
      sentences.push(
        `${pluralize(totals.recurring, "active recurring schedule", "active recurring schedules")} will be stopped.`
      );
    }

    if (sentences.length === 0) return "This cannot be undone.";

    sentences.push("This cannot be undone — archive instead if you'd rather keep the link.");
    return sentences.join(" ");
  }

  // "Select all" is bounded by the same cap the bulk routes enforce. None of these
  // lists paginate, so on a large org an uncapped select-all would build a request
  // the server rejects with a bare "Invalid request" and no explanation. The cap
  // is measured against the whole selection, not just the visible rows: toggleAll
  // unions, and a selection survives a change of search, so selecting all under
  // one search and then all under another would otherwise reach twice the cap.
  const [selectAllCapped, setSelectAllCapped] = useState(false);
  const selectableIds = filteredIds.slice(0, MAX_BULK_IDS);
  const selectionNote =
    selectAllCapped && selection.count >= MAX_BULK_IDS ? `Maximum ${MAX_BULK_IDS} per action` : undefined;

  function handleSelectAll() {
    if (selection.allSelected(selectableIds)) {
      setSelectAllCapped(false);
      selection.toggleAll(selectableIds);
      return;
    }

    const { add, capped } = selectAllAddition(
      filteredIds,
      selection.isSelected,
      selection.count,
      MAX_BULK_IDS
    );
    setSelectAllCapped(capped);
    selection.toggleAll(add);
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
        titleFor={titleForDelete}
        describeFor={describeForDelete}
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
