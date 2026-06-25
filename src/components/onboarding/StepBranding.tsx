"use client";

import { cn } from "@/lib/utils";
import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const ACCENT_OPTIONS = [
  "#111827", "#1d4ed8", "#7c3aed", "#be185d", "#047857", "#b45309",
];

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow";

export default function StepBranding({ data, update, onBack, onNext }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif text-neutral-950 mb-1">Brand your invoices</h2>
        <p className="text-sm text-neutral-500">Choose an accent colour for your invoice templates.</p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-neutral-950 mb-3">Accent colour</p>
          <div className="flex items-center gap-2.5 flex-wrap">
            {ACCENT_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => update({ accentColor: color })}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-all",
                  data.accentColor === color
                    ? "border-neutral-950 scale-110"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
            <input
              type="color"
              value={data.accentColor}
              onChange={(e) => update({ accentColor: e.target.value })}
              className="h-8 w-8 rounded-full cursor-pointer border border-neutral-200 overflow-hidden"
              title="Custom colour"
            />
          </div>
        </div>

        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-neutral-950 mb-1.5">Logo URL</label>
          <input
            id="logoUrl"
            value={data.logoUrl}
            onChange={(e) => update({ logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-neutral-400">Upload a logo from Settings after setup.</p>
        </div>

        {data.accentColor && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wide font-medium">Preview</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg shrink-0" style={{ backgroundColor: data.accentColor }} />
              <div>
                <p className="text-sm font-medium text-neutral-950">{data.orgName || "Your Business"}</p>
                <p className="text-xs" style={{ color: data.accentColor }}>Invoice #INV-0001</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
