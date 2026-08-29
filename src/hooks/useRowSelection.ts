"use client";

import { useState, useCallback } from "react";

/**
 * Selection state for a list with checkboxes.
 *
 * `toggleAll` operates only on the ids currently visible, so selections made
 * before a search was typed survive selecting or clearing the filtered rows.
 */
export function useRowSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const allSelected = useCallback(
    (visibleIds: string[]) => visibleIds.length > 0 && visibleIds.every((id) => selected.has(id)),
    [selected]
  );

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((visibleIds: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const everyVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));

      if (everyVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));

      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return {
    selected,
    count: selected.size,
    isSelected,
    allSelected,
    toggleOne,
    toggleAll,
    clear,
  };
}
