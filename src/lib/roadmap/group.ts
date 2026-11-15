import type { PublicRoadmapItem, RoadmapImportance, RoadmapStatus } from "./types";

export interface RoadmapSection {
  key: string;
  label: string;
  items: PublicRoadmapItem[];
}

const bySortThenTitle = (a: PublicRoadmapItem, b: PublicRoadmapItem) =>
  a.sort_order - b.sort_order || a.title.localeCompare(b.title);

/** Planned tab: In progress first, then Up next. */
export function groupByStatus(
  items: PublicRoadmapItem[],
  order: RoadmapStatus[],
  labels: Record<RoadmapStatus, string>,
): RoadmapSection[] {
  return order
    .map((status) => ({
      key: status,
      label: labels[status],
      items: items.filter((i) => i.status === status).sort(bySortThenTitle),
    }))
    .filter((s) => s.items.length > 0);
}

/** Considering tab: one section per category, alphabetical, General last. */
export function groupByCategory(items: PublicRoadmapItem[]): RoadmapSection[] {
  const map = new Map<string, PublicRoadmapItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === "General" ? 1 : b === "General" ? -1 : a.localeCompare(b)))
    .map(([category, list]) => ({ key: category, label: category, items: list.sort(bySortThenTitle) }));
}

/** Launched tab: newest month first. Items without a date go last. */
export function groupByLaunchMonth(items: PublicRoadmapItem[]): RoadmapSection[] {
  const sorted = [...items].sort((a, b) => {
    if (a.launched_at && b.launched_at) return b.launched_at.localeCompare(a.launched_at);
    if (a.launched_at) return -1;
    if (b.launched_at) return 1;
    return bySortThenTitle(a, b);
  });
  const sections: RoadmapSection[] = [];
  for (const item of sorted) {
    const key = item.launched_at?.slice(0, 7) ?? "earlier";
    const label = item.launched_at
      ? new Date(`${item.launched_at}T00:00:00Z`).toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : "Earlier";
    const last = sections[sections.length - 1];
    if (last?.key === key) last.items.push(item);
    else sections.push({ key, label, items: [item] });
  }
  return sections;
}

export function matchesSearch(item: PublicRoadmapItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.title, item.summary, item.body, item.category].some((f) => f.toLowerCase().includes(q));
}

export type ImportanceTally = Record<RoadmapImportance, number>;

export function emptyTally(): ImportanceTally {
  return { not_important: 0, nice_to_have: 0, important: 0, critical: 0 };
}

/**
 * One number to rank items by in admin: critical 3, important 2, nice to have
 * 1, not important 0. Raw counts stay visible next to it.
 */
export function demandScore(t: ImportanceTally): number {
  return t.critical * 3 + t.important * 2 + t.nice_to_have;
}
