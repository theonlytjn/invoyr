"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ROADMAP_COPY as COPY, ROADMAP_IMPORTANCE, ROADMAP_STATUS_LABELS } from "@/config/roadmap";
import type { PublicRoadmapItem, RoadmapImportance, RoadmapVote } from "@/lib/roadmap/types";
import { RoadmapBody } from "./RoadmapBody";
import { cn } from "@/lib/utils";

interface Props {
  item: PublicRoadmapItem | null;
  vote: RoadmapVote | undefined;
  signedIn: boolean;
  signInUrl: (slug: string) => string;
  signUpUrl: string;
  onVote: (itemId: string, importance: RoadmapImportance | null, comment?: string | null) => Promise<boolean>;
  onClose: () => void;
}

export function RoadmapItemDialog({ item, vote, signedIn, signInUrl, signUpUrl, onVote, onClose }: Props) {
  const [saving, setSaving] = useState<RoadmapImportance | "comment" | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [comment, setComment] = useState(vote?.comment ?? "");

  useEffect(() => {
    setComment(vote?.comment ?? "");
    setStatus("idle");
  }, [item?.id, vote?.comment]);

  async function choose(importance: RoadmapImportance) {
    if (!item) return;
    setSaving(importance);
    // Choosing the current answer again clears it.
    const next = vote?.importance === importance ? null : importance;
    const ok = await onVote(item.id, next);
    setSaving(null);
    setStatus(ok ? "saved" : "error");
  }

  async function saveComment() {
    if (!item || !vote) return;
    setSaving("comment");
    const ok = await onVote(item.id, vote.importance, comment);
    setSaving(null);
    setStatus(ok ? "saved" : "error");
  }

  const canVote = item && item.status !== "launched";

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl gap-0 overflow-y-auto rounded-2xl border-neutral-800 bg-neutral-950 p-0 text-neutral-100">
        {item && (
          <>
            <div className="p-6 sm:p-8">
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-neutral-400">
                {item.category} · {ROADMAP_STATUS_LABELS[item.status]}
              </p>
              <DialogTitle className="mt-2 pr-6 font-serif text-2xl leading-tight text-neutral-50">
                {item.title}
              </DialogTitle>
              <DialogDescription className="sr-only">{item.summary || item.title}</DialogDescription>
              <div className="mt-5">
                <RoadmapBody text={item.body || item.summary} />
              </div>
            </div>

            {canVote && (
              <div className="border-t border-neutral-800 bg-neutral-900/60 p-6 sm:px-8">
                <p className="text-sm font-medium text-neutral-100">{COPY.importanceQuestion}</p>
                {signedIn ? (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={COPY.importanceQuestion}>
                      {ROADMAP_IMPORTANCE.map((opt) => {
                        const active = vote?.importance === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            aria-pressed={active}
                            disabled={saving !== null}
                            onClick={() => choose(opt.value)}
                            className={cn(
                              "min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-60",
                              active
                                ? "border-brand bg-brand text-brand-foreground"
                                : "border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:text-neutral-50",
                            )}
                          >
                            {saving === opt.value ? "Saving…" : opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {vote && (
                      <div className="mt-5">
                        <label htmlFor="roadmap-comment" className="text-sm text-neutral-300">
                          {COPY.commentLabel}
                        </label>
                        <textarea
                          id="roadmap-comment"
                          value={comment}
                          maxLength={1000}
                          rows={3}
                          onChange={(e) => {
                            setComment(e.target.value);
                            setStatus("idle");
                          }}
                          placeholder={COPY.commentPlaceholder}
                          className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-[15px] text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none"
                        />
                        {comment.trim() !== (vote.comment ?? "") && (
                          <button
                            type="button"
                            onClick={saveComment}
                            disabled={saving !== null}
                            className="mt-2 min-h-11 rounded-lg bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-60"
                          >
                            {saving === "comment" ? "Saving…" : COPY.saveComment}
                          </button>
                        )}
                      </div>
                    )}

                    <p className="mt-3 min-h-5 text-sm" role="status" aria-live="polite">
                      {status === "saved" && <span className="text-brand">{COPY.voteSaved}</span>}
                      {status === "error" && <span className="text-red-400">{COPY.voteError}</span>}
                    </p>
                  </>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <a
                      href={signInUrl(item.slug)}
                      className="inline-flex min-h-11 items-center rounded-lg bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white"
                    >
                      {COPY.signInToVote}
                    </a>
                    <a href={signUpUrl} className="text-sm text-neutral-300 underline underline-offset-2 hover:text-neutral-50">
                      New to Invoyr? Start a free trial
                    </a>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
