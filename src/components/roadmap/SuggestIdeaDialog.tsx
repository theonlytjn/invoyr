"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ROADMAP_COPY as COPY } from "@/config/roadmap";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submit: (title: string, details: string) => Promise<{ ok: boolean; error?: string }>;
}

const field =
  "mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-[15px] text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none";

export function SuggestIdeaDialog({ open, onOpenChange, submit }: Props) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function reset(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      // Let the close animation finish before clearing.
      setTimeout(() => {
        setTitle("");
        setDetails("");
        setState("idle");
        setError(null);
      }, 200);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const res = await submit(title, details);
    if (res.ok) setState("sent");
    else {
      setState("error");
      setError(res.error ?? COPY.ideaError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border-neutral-800 bg-neutral-950 p-6 text-neutral-100 sm:p-8">
        {state === "sent" ? (
          <div role="status">
            <DialogTitle className="font-serif text-2xl text-neutral-50">{COPY.ideaSuccessTitle}</DialogTitle>
            <DialogDescription className="mt-3 text-[15px] leading-relaxed text-neutral-300">
              {COPY.ideaSuccessBody}
            </DialogDescription>
            <button
              type="button"
              onClick={() => reset(false)}
              className="mt-6 min-h-11 rounded-lg bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white"
            >
              {COPY.close}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <DialogTitle className="font-serif text-2xl text-neutral-50">{COPY.submitIdea}</DialogTitle>
            <DialogDescription className="mt-2 text-[15px] text-neutral-400">
              {COPY.ideaIntro}
            </DialogDescription>

            <label htmlFor="idea-title" className="mt-6 block text-sm font-medium text-neutral-200">
              {COPY.ideaTitleLabel}
            </label>
            <input
              id="idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              autoFocus
              placeholder={COPY.ideaTitlePlaceholder}
              className={field}
            />

            <label htmlFor="idea-details" className="mt-5 block text-sm font-medium text-neutral-200">
              {COPY.ideaDetailsLabel}
            </label>
            <textarea
              id="idea-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={COPY.ideaDetailsPlaceholder}
              className={field}
            />

            {error && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "sending" || title.trim().length < 3}
              className="mt-6 min-h-11 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {state === "sending" ? "Sending…" : COPY.ideaSubmit}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
