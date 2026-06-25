"use client";

import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  onBack: () => void;
  onComplete: () => void;
  saving: boolean;
}

const FEATURES = [
  {
    title: "Create your first invoice",
    desc: "Add a client and send a professional invoice in minutes.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: "Get paid online",
    desc: "Clients pay via Stripe — funds go straight to your bank.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    title: "Track your revenue",
    desc: "Your dashboard shows what's paid, pending, and overdue.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function StepFirstInvoice({ data, onBack, onComplete, saving }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif text-neutral-950 mb-1">You&apos;re almost ready!</h2>
        <p className="text-sm text-neutral-500">Here&apos;s what you can do straight away.</p>
      </div>

      <div className="space-y-3">
        {FEATURES.map((item) => (
          <div key={item.title} className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-950">
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-950">{item.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Business</span>
          <span className="font-medium text-neutral-950">{data.orgName || "—"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-neutral-500">Plan</span>
          <span className="font-medium text-neutral-950 capitalize">{data.plan} · 14-day trial</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={saving}
          className="flex-1 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Setting up…" : "Go to dashboard →"}
        </button>
      </div>
    </div>
  );
}
