"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepBranding({ data, update, onBack, onNext }: Props) {
  const ACCENT_OPTIONS = [
    "#111827", "#1d4ed8", "#7c3aed", "#be185d", "#047857", "#b45309",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Brand your invoices</h2>
        <p className="mt-1 text-gray-500">Choose an accent colour for your invoice templates.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Accent colour</Label>
          <div className="flex items-center gap-3 flex-wrap">
            {ACCENT_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: color,
                  borderColor: data.accentColor === color ? color : "transparent",
                  outline: data.accentColor === color ? `2px solid ${color}` : "none",
                  outlineOffset: "2px",
                }}
                onClick={() => update({ accentColor: color })}
              />
            ))}
            <input
              type="color"
              value={data.accentColor}
              onChange={(e) => update({ accentColor: e.target.value })}
              className="w-8 h-8 rounded-full cursor-pointer border border-gray-200"
              title="Custom colour"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            value={data.logoUrl}
            onChange={(e) => update({ logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-gray-500">
            You can upload a logo from Settings after setup.
          </p>
        </div>

        {data.accentColor && (
          <div className="p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg"
                style={{ backgroundColor: data.accentColor }}
              />
              <div>
                <p className="font-semibold text-gray-900">{data.orgName || "Your Business"}</p>
                <p className="text-xs" style={{ color: data.accentColor }}>Invoice #INV-0001</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1" onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
