"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  ROADMAP_CATEGORIES,
  ROADMAP_IMPORTANCE,
  ROADMAP_STATUS_LABELS,
} from "@/config/roadmap";
import type { ImportanceTally } from "@/lib/roadmap/group";
import { slugify } from "@/lib/roadmap/schema";
import type { RoadmapIdea, RoadmapIdeaStatus, RoadmapImportance, RoadmapItem, RoadmapStatus } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

export interface AdminFeedback {
  email: string;
  importance: RoadmapImportance;
  comment: string | null;
  at: string;
}
export type AdminItem = RoadmapItem & { tally: ImportanceTally; score: number; feedback: AdminFeedback[] };
export type AdminIdea = RoadmapIdea & { email: string };

const STATUSES: RoadmapStatus[] = ["in_progress", "planned", "considering", "launched"];
const IMPORTANCE_LABEL = Object.fromEntries(ROADMAP_IMPORTANCE.map((o) => [o.value, o.label])) as Record<RoadmapImportance, string>;
const IDEA_STATUS_LABEL: Record<RoadmapIdeaStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  merged: "Merged",
  published: "On roadmap",
  declined: "Declined",
};

type Draft = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  status: RoadmapStatus;
  is_published: boolean;
  sort_order: number;
  launched_at: string;
  fromIdeaId?: string;
};

const blankDraft = (): Draft => ({
  title: "",
  slug: "",
  summary: "",
  body: "",
  category: "General",
  status: "considering",
  is_published: false,
  sort_order: 0,
  launched_at: "",
});

const nativeSelect =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

export function RoadmapAdmin({ items, ideas }: { items: AdminItem[]; ideas: AdminIdea[] }) {
  const router = useRouter();
  const [view, setView] = useState<"items" | "ideas">("items");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<AdminItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"status" | "demand">("status");

  const newIdeas = ideas.filter((i) => i.status === "new").length;
  const sortedItems = useMemo(() => {
    if (sort === "demand") return [...items].sort((a, b) => b.score - a.score);
    return [...items].sort(
      (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.sort_order - b.sort_order,
    );
  }, [items, sort]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    const { id, fromIdeaId, launched_at, slug, ...rest } = draft;
    const payload = {
      ...rest,
      slug: slug || slugify(rest.title),
      launched_at: launched_at || null,
      ...(fromIdeaId ? { fromIdeaId } : {}),
    };
    const ok = await run("save", () =>
      id ? send(`/api/admin/roadmap/items/${id}`, "PATCH", payload) : send("/api/admin/roadmap/items", "POST", payload),
    );
    if (ok) setDraft(null);
  }

  const patchItem = (id: string, body: Partial<RoadmapItem>) =>
    run(`item-${id}`, () => send(`/api/admin/roadmap/items/${id}`, "PATCH", body));
  const patchIdea = (id: string, body: Record<string, unknown>) =>
    run(`idea-${id}`, () => send(`/api/admin/roadmap/ideas/${id}`, "PATCH", body));

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 dark:text-neutral-50">Roadmap</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Public at{" "}
            <a href="https://invoyr.io/roadmap" target="_blank" rel="noreferrer" className="underline underline-offset-2">
              invoyr.io/roadmap
            </a>
            . Only published items show there; vote counts and comments are only visible here.
          </p>
        </div>
        <Button onClick={() => setDraft(blankDraft())}>New item</Button>
      </div>

      <div role="tablist" className="mb-6 flex gap-2">
        {(
          [
            ["items", `Items (${items.length})`],
            ["ideas", `Ideas inbox${newIdeas ? ` (${newIdeas} new)` : ""}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium",
              view === id
                ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                : "text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {view === "items" ? (
        items.length === 0 ? (
          <Empty text="No roadmap items yet. Add one, or turn an idea from the inbox into one." />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2 text-sm text-neutral-500">
              <span>Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={cn(nativeSelect, "h-9 w-auto")}>
                <option value="status">Stage</option>
                <option value="demand">Demand</option>
              </select>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <table className="w-full min-w-[52rem] text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wider text-neutral-400 dark:border-neutral-800">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Public</th>
                    <th className="px-4 py-3" title="Critical / Important / Nice to have / Not important">Votes C·I·N·–</th>
                    <th className="px-4 py-3">Demand</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => {
                    const comments = item.feedback.filter((f) => f.comment).length;
                    return (
                      <tr key={item.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-950 dark:text-neutral-50">{item.title}</p>
                          <p className="text-xs text-neutral-500">{item.category}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            aria-label={`Stage for ${item.title}`}
                            value={item.status}
                            disabled={busy === `item-${item.id}`}
                            onChange={(e) => patchItem(item.id, { status: e.target.value as RoadmapStatus })}
                            className={cn(nativeSelect, "h-9")}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {ROADMAP_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.is_published}
                              disabled={busy === `item-${item.id}`}
                              onChange={(e) => patchItem(item.id, { is_published: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <span className="text-neutral-600 dark:text-neutral-300">{item.is_published ? "Live" : "Draft"}</span>
                          </label>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-neutral-700 dark:text-neutral-300">
                          {item.tally.critical} · {item.tally.important} · {item.tally.nice_to_have} · {item.tally.not_important}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium text-neutral-950 dark:text-neutral-50">{item.score}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {item.feedback.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setFeedbackFor(item)}>
                              Feedback{comments ? ` (${comments})` : ""}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDraft({ ...item, launched_at: item.launched_at ?? "" })
                            }
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : ideas.length === 0 ? (
        <Empty text="No ideas yet. They'll appear here when people use “Suggest an idea” on the roadmap." />
      ) : (
        <ul className="space-y-3">
          {ideas.map((idea) => (
            <IdeaRow
              key={idea.id}
              idea={idea}
              items={items}
              busy={busy === `idea-${idea.id}`}
              onPatch={(body) => patchIdea(idea.id, body)}
              onPromote={() =>
                setDraft({ ...blankDraft(), title: idea.title, body: idea.details, summary: idea.details.slice(0, 300), fromIdeaId: idea.id })
              }
            />
          ))}
        </ul>
      )}

      <ItemDialog
        draft={draft}
        busy={busy === "save"}
        error={error}
        onChange={setDraft}
        onSave={saveDraft}
        onDelete={
          draft?.id
            ? async () => {
                const ok = await run("save", () => send(`/api/admin/roadmap/items/${draft.id}`, "DELETE"));
                if (ok) setDraft(null);
              }
            : undefined
        }
        onClose={() => setDraft(null)}
      />

      <Dialog open={!!feedbackFor} onOpenChange={(o) => !o && setFeedbackFor(null)}>
        <DialogContent className="max-h-[85dvh] max-w-xl overflow-y-auto">
          <DialogTitle>{feedbackFor?.title}</DialogTitle>
          <DialogDescription>
            {feedbackFor?.feedback.length} vote{feedbackFor?.feedback.length === 1 ? "" : "s"}, newest first.
          </DialogDescription>
          <ul className="space-y-3">
            {feedbackFor?.feedback.map((f, i) => (
              <li key={i} className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <a href={`mailto:${f.email}`} className="font-medium underline-offset-2 hover:underline">{f.email}</a>
                  <span className="text-xs text-neutral-500">
                    {IMPORTANCE_LABEL[f.importance]} · {new Date(f.at).toLocaleDateString("en-GB")}
                  </span>
                </div>
                {f.comment && <p className="mt-2 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{f.comment}</p>}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center text-sm text-neutral-500 dark:border-neutral-700">
      {text}
    </div>
  );
}

function IdeaRow({
  idea,
  items,
  busy,
  onPatch,
  onPromote,
}: {
  idea: AdminIdea;
  items: AdminItem[];
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => void;
  onPromote: () => void;
}) {
  const [mergeInto, setMergeInto] = useState("");
  const linked = items.find((i) => i.id === idea.item_id);
  const open = idea.status === "new" || idea.status === "reviewed";

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-neutral-950 dark:text-neutral-50">{idea.title}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            <a href={`mailto:${idea.email}`} className="hover:underline">{idea.email}</a> ·{" "}
            {new Date(idea.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            idea.status === "new"
              ? "bg-brand text-brand-foreground"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
          )}
        >
          {IDEA_STATUS_LABEL[idea.status]}
          {linked ? `: ${linked.title}` : ""}
        </span>
      </div>
      {idea.details && <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{idea.details}</p>}

      {open && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={busy} onClick={onPromote}>Add to roadmap</Button>
          <div className="flex items-center gap-2">
            <select
              aria-label="Merge into item"
              value={mergeInto}
              onChange={(e) => setMergeInto(e.target.value)}
              className={cn(nativeSelect, "h-9 w-48")}
            >
              <option value="">Merge into…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.title}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" disabled={busy || !mergeInto} onClick={() => onPatch({ status: "merged", item_id: mergeInto })}>
              Merge
            </Button>
          </div>
          {idea.status === "new" && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onPatch({ status: "reviewed" })}>Mark reviewed</Button>
          )}
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onPatch({ status: "declined" })}>Decline</Button>
        </div>
      )}
      {!open && (
        <Button size="sm" variant="ghost" className="mt-3" disabled={busy} onClick={() => onPatch({ status: "reviewed", item_id: null })}>
          Reopen
        </Button>
      )}
    </li>
  );
}

function ItemDialog({
  draft,
  busy,
  error,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  draft: Draft | null;
  busy: boolean;
  error: string | null;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!draft) return null;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) { setConfirmDelete(false); onClose(); } }}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogTitle>{draft.id ? "Edit item" : draft.fromIdeaId ? "Add idea to roadmap" : "New roadmap item"}</DialogTitle>
        <DialogDescription>Body is plain text: blank lines make paragraphs, lines starting “- ” make a list.</DialogDescription>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div>
            <Label htmlFor="ri-title">Title</Label>
            <Input id="ri-title" value={draft.title} maxLength={120} required onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ri-category">Category</Label>
              <Input id="ri-category" list="ri-categories" value={draft.category} maxLength={40} onChange={(e) => set("category", e.target.value)} />
              <datalist id="ri-categories">
                {ROADMAP_CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <Label htmlFor="ri-status">Stage</Label>
              <select id="ri-status" value={draft.status} onChange={(e) => set("status", e.target.value as RoadmapStatus)} className={nativeSelect}>
                {STATUSES.map((s) => <option key={s} value={s}>{ROADMAP_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="ri-summary">Card summary <span className="text-neutral-400">(one or two sentences)</span></Label>
            <Textarea id="ri-summary" rows={2} maxLength={300} value={draft.summary} onChange={(e) => set("summary", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ri-body">Full description</Label>
            <Textarea id="ri-body" rows={7} maxLength={5000} value={draft.body} onChange={(e) => set("body", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="ri-slug">Link slug</Label>
              <Input id="ri-slug" value={draft.slug} placeholder={slugify(draft.title) || "auto"} onChange={(e) => set("slug", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ri-order">Order</Label>
              <Input id="ri-order" type="number" value={draft.sort_order} onChange={(e) => set("sort_order", Number(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="ri-launched">Launched on</Label>
              <Input id="ri-launched" type="date" value={draft.launched_at} onChange={(e) => set("launched_at", e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.is_published} onChange={(e) => set("is_published", e.target.checked)} className="h-4 w-4" />
            Published on the public roadmap
          </label>

          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {onDelete && (
                confirmDelete ? (
                  <Button type="button" variant="destructive" disabled={busy} onClick={onDelete}>Confirm delete (votes too)</Button>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>Delete</Button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={busy || draft.title.trim().length < 3}>{busy ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
