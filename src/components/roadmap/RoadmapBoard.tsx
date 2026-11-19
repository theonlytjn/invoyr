"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMarketingSession } from "@/hooks/useMarketingSession";
import { ROADMAP_COPY as COPY, ROADMAP_STATUS_LABELS, ROADMAP_TABS, type RoadmapTab } from "@/config/roadmap";
import { groupByCategory, groupByLaunchMonth, groupByStatus, matchesSearch } from "@/lib/roadmap/group";
import type { PublicRoadmapItem, RoadmapImportance, RoadmapVote } from "@/lib/roadmap/types";
import { RoadmapItemDialog } from "./RoadmapItemDialog";
import { SuggestIdeaDialog, type IdeaSubmission } from "./SuggestIdeaDialog";
import { cn } from "@/lib/utils";

const IMPORTANCE_SHORT: Record<RoadmapImportance, string> = {
  not_important: "Not important",
  nice_to_have: "Nice to have",
  important: "Important",
  critical: "Critical",
};

/** Reads and writes ?tab= and ?item= without a server round trip (the page is static). */
function setQuery(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  window.history.replaceState(null, "", url);
}

export function RoadmapBoard({ items }: { items: PublicRoadmapItem[] }) {
  const { session, appOrigin } = useMarketingSession();
  const signedIn = session.status === "signed-in";

  const [tab, setTab] = useState<RoadmapTab>("planned");
  const [query, setQueryText] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [votes, setVotes] = useState<Record<string, RoadmapVote>>({});

  // Deep links: ?tab=considering, ?item=<slug>, ?suggest=1.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (ROADMAP_TABS.some((x) => x.id === t)) setTab(t as RoadmapTab);
    else {
      // No tab asked for: open on the first one with something in it.
      const firstFull = ROADMAP_TABS.find((x) => items.some((i) => x.statuses.includes(i.status)));
      if (firstFull) setTab(firstFull.id);
    }
    const slug = params.get("item");
    const linked = items.find((i) => i.slug === slug);
    if (linked) {
      setOpenSlug(linked.slug);
      setTab(ROADMAP_TABS.find((x) => x.statuses.includes(linked.status))!.id);
    }
    if (params.get("suggest") === "1") setSuggestOpen(true);
  }, [items]);

  // The visitor's own votes, once we know they're signed in.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    fetch(`${appOrigin}/api/roadmap/votes`, { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { votes: [] }))
      .then((data: { votes: RoadmapVote[] }) => {
        if (!cancelled) setVotes(Object.fromEntries(data.votes.map((v) => [v.item_id, v])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signedIn, appOrigin]);

  const vote = useCallback(
    async (itemId: string, importance: RoadmapImportance | null, comment?: string | null) => {
      try {
        const res = await fetch(`${appOrigin}/api/roadmap/votes`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, importance, ...(comment !== undefined ? { comment } : {}) }),
        });
        if (!res.ok) return false;
        const data: { vote: RoadmapVote | null } = await res.json();
        setVotes((prev) => {
          const next = { ...prev };
          if (data.vote) next[itemId] = data.vote;
          else delete next[itemId];
          return next;
        });
        return true;
      } catch {
        return false;
      }
    },
    [appOrigin],
  );

  const suggest = useCallback(
    async (idea: IdeaSubmission) => {
      try {
        const res = await fetch(`${appOrigin}/api/roadmap/ideas`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(idea),
        });
        if (res.ok) return { ok: true };
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error as string | undefined };
      } catch {
        return { ok: false };
      }
    },
    [appOrigin],
  );

  const signInUrl = useCallback(
    (next: string) => `${appOrigin}/login?next=${encodeURIComponent(next)}`,
    [appOrigin],
  );

  const current = ROADMAP_TABS.find((t) => t.id === tab)!;
  const sections = useMemo(() => {
    const visible = items.filter((i) => current.statuses.includes(i.status) && matchesSearch(i, query));
    if (tab === "planned") return groupByStatus(visible, current.statuses, ROADMAP_STATUS_LABELS);
    if (tab === "launched") return groupByLaunchMonth(visible);
    return groupByCategory(visible);
  }, [items, current, tab, query]);

  const counts = useMemo(
    () => Object.fromEntries(ROADMAP_TABS.map((t) => [t.id, items.filter((i) => t.statuses.includes(i.status)).length])),
    [items],
  );

  const openItem = items.find((i) => i.slug === openSlug) ?? null;

  function selectTab(id: RoadmapTab) {
    setTab(id);
    setQuery({ tab: id });
  }

  function open(slug: string | null) {
    setOpenSlug(slug);
    setQuery({ item: slug });
  }


  return (
    <div>
      {/* Toolbar: tabs, search, suggest */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div role="tablist" aria-label="Roadmap stages" className="-mb-[17px] flex gap-6 overflow-x-auto">
          {ROADMAP_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="roadmap-panel"
              onClick={() => selectTab(t.id)}
              className={cn(
                "min-h-11 shrink-0 border-b-2 pb-3 font-mono text-[0.8125rem] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:text-neutral-50",
                tab === t.id
                  ? "border-brand text-neutral-50"
                  : "border-transparent text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t.label}
              <span className="ml-2 text-neutral-500">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block">
            <span className="sr-only">{COPY.searchPlaceholder}</span>
            <svg aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={COPY.searchPlaceholder}
              className="min-h-11 w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-[15px] text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none sm:w-64"
            />
          </label>
          <button
            type="button"
            onClick={() => setSuggestOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <span aria-hidden className="text-base leading-none">+</span>
            {COPY.submitIdea}
          </button>
        </div>
      </div>

      {/* Panel */}
      <div id="roadmap-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-10">
        {sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 px-6 py-16 text-center">
            <p className="text-neutral-400">{query ? COPY.noResults : COPY.emptyTab[tab]}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.key} aria-labelledby={`sec-${section.key}`}>
                <div className="mb-5 flex items-center gap-4">
                  <h2 id={`sec-${section.key}`} className="shrink-0 font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-400">
                    {section.label}
                  </h2>
                  <div className="h-px flex-1 bg-neutral-800" />
                </div>
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((item) => {
                    const mine = votes[item.id];
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => open(item.slug)}
                          className="group flex h-full w-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 text-left transition-colors hover:border-neutral-600 hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                            {tab === "considering" ? ROADMAP_STATUS_LABELS[item.status] : item.category}
                          </span>
                          <span className="mt-2 font-serif text-xl leading-snug text-neutral-50">{item.title}</span>
                          {item.summary && (
                            <span className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-neutral-400">
                              {item.summary}
                            </span>
                          )}
                          {mine && (
                            <span className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-brand/40 px-2.5 py-1 text-xs text-brand">
                              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                              You said: {IMPORTANCE_SHORT[mine.importance]}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <RoadmapItemDialog
        item={openItem}
        vote={openItem ? votes[openItem.id] : undefined}
        signedIn={signedIn}
        signInUrl={(slug) => signInUrl(`/roadmap?item=${slug}`)}
        signUpUrl={`${appOrigin}/signup`}
        onVote={vote}
        onClose={() => open(null)}
      />
      <SuggestIdeaDialog
        open={suggestOpen}
        onOpenChange={(o) => {
          setSuggestOpen(o);
          if (!o) setQuery({ suggest: null });
        }}
        submit={suggest}
        guest={!signedIn}
        defaults={{
          name: signedIn ? session.name ?? "" : "",
          email: signedIn ? session.email ?? "" : "",
        }}
      />
    </div>
  );
}
