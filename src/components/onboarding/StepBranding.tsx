"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LOGO_ACCEPTED_TYPES, validateLogoFile } from "@/lib/onboarding/logo-upload";
import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onLogoChange: (file: File | null) => void;
  logoFile: File | null;
  onBack: () => void;
  onNext: () => void;
}

const ACCENT_OPTIONS = [
  "#111827", "#1d4ed8", "#7c3aed", "#be185d", "#047857", "#b45309",
];

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow";

export default function StepBranding({ data, update, onLogoChange, logoFile, onBack, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // The file can't be uploaded until the org exists (created on the last step),
  // so the preview reads it locally. The object URL is revoked on replacement
  // to avoid leaking it for the rest of the session.
  useEffect(() => {
    if (!logoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const invalid = validateLogoFile(file);
    if (invalid) {
      setLogoError(invalid);
      onLogoChange(null);
      e.target.value = "";
      return;
    }
    setLogoError(null);
    onLogoChange(file);
  }

  function clearLogo() {
    setLogoError(null);
    onLogoChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
          <p className="block text-sm font-medium text-neutral-950 mb-1.5">Logo</p>
          <input
            ref={fileInputRef}
            id="logo"
            type="file"
            accept={LOGO_ACCEPTED_TYPES.join(",")}
            onChange={handleFile}
            className={cn(
              inputClass,
              "cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-950 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-neutral-800"
            )}
            aria-describedby="logo-hint"
          />
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p id="logo-hint" className="text-xs text-neutral-400">
              PNG, JPG, WEBP or SVG, up to 2MB. You can change it later in Settings.
            </p>
            {logoFile && (
              <button
                type="button"
                onClick={clearLogo}
                className="shrink-0 text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-950"
              >
                Remove
              </button>
            )}
          </div>
          {logoError && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">{logoError}</p>
          )}
        </div>

        {data.accentColor && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wide font-medium">Preview</p>
            <div className="flex items-center gap-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Your logo"
                  className="h-10 w-10 shrink-0 rounded-lg border border-neutral-200 object-contain"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg shrink-0" style={{ backgroundColor: data.accentColor }} />
              )}
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
