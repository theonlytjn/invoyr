"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import EstimateStatusBadge from "./EstimateStatusBadge";
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
import { useRowSelection } from "@/hooks/useRowSelection";
import { MAX_BULK_IDS } from "@/lib/bulk-actions";
import type { EstimateWithClient } from "@/lib/supabase/types";

interface Props {
  estimates: EstimateWithClient[];
}

export default function EstimatesTable({ estimates }: Props) {
  const router = useRouter();
  const selection = useRowSelection();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const allIds = estimates.map((e) => e.id);
  const selectedIds = allIds.filter((id) => selection.isSelected(id));

  // "Select all" is bounded by the same cap the bulk routes enforce. None of these
  // lists paginate, so on a large org an uncapped select-all would build a request
  // the server rejects with a bare "Invalid request" and no explanation.
  const [selectAllCapped, setSelectAllCapped] = useState(false);
  const selectableIds = allIds.slice(0, MAX_BULK_IDS);
  const selectionNote =
    selectAllCapped && selection.count >= MAX_BULK_IDS ? `First ${MAX_BULK_IDS} selected` : undefined;

  function handleSelectAll() {
    setSelectAllCapped(!selection.allSelected(selectableIds) && allIds.length > MAX_BULK_IDS);
    selection.toggleAll(selectableIds);
  }

  function clearSelection() {
    setSelectAllCapped(false);
    selection.clear();
  }

  return (
    <div className="space-y-4">
      <BulkActionBar count={selection.count} onClear={clearSelection} note={selectionNote}>
        <button
          onClick={() => setDeleteOpen(true)}
          className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </BulkActionBar>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-3 pl-5 pr-2 w-8">
                  <RowCheckbox
                    checked={selection.allSelected(selectableIds)}
                    onChange={handleSelectAll}
                    label="Select all"
                  />
                </th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Number</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Client</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Date</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Expires</th>
                <th className="text-right px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Total</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {estimates.map((est) => (
                <tr
                  key={est.id}
                  className={`transition-colors ${
                    selection.isSelected(est.id)
                      ? "bg-neutral-50 dark:bg-neutral-800/60"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <td className="py-3.5 pl-5 pr-2">
                    <RowCheckbox
                      checked={selection.isSelected(est.id)}
                      onChange={() => selection.toggleOne(est.id)}
                      label={`Select ${est.estimate_number}`}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/estimates/${est.id}`} className="font-medium text-neutral-950 dark:text-neutral-50 hover:underline">
                      {est.estimate_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                    {est.clients?.name ?? <span className="text-neutral-400">No client</span>}
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                    {formatDate(est.issue_date)}
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                    {est.expiry_date ? formatDate(est.expiry_date) : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-neutral-950 dark:text-neutral-50">
                    {formatCurrency(est.total, est.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <EstimateStatusBadge status={est.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BulkDeleteDialog
        open={deleteOpen}
        endpoint="/api/estimates/bulk/delete"
        ids={selectedIds}
        noun="estimate"
        nounPlural="estimates"
        onCancel={() => setDeleteOpen(false)}
        onDeleted={(result) => {
          setDeleteOpen(false);
          clearSelection();
          showToast(
            `Deleted ${result.deleted} estimate${result.deleted !== 1 ? "s" : ""}` +
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
