"use client";

import type { ReactNode } from "react";

interface Props {
  count: number;
  onClear: () => void;
  /**
   * Optional aside next to the count, e.g. "First 50 selected" when select-all
   * hit the per-request cap. Muted, so it explains without competing with the
   * actions.
   */
  note?: string;
  children: ReactNode;
}

export function BulkActionBar({ count, onClear, note, children }: Props) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-neutral-950 dark:bg-neutral-800 text-white rounded-xl text-sm">
      <span className="font-medium mr-1">{count} selected</span>
      {note && <span className="text-neutral-400 text-xs -ml-1 mr-1">{note}</span>}
      {children}
      <button
        onClick={onClear}
        className="ml-auto text-neutral-400 hover:text-white transition-colors text-xs"
      >
        Clear
      </button>
    </div>
  );
}
