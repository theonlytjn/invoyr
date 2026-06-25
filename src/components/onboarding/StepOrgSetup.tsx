"use client";

import { slugify } from "@/lib/utils";
import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow";

const labelClass = "block text-sm font-medium text-neutral-950 mb-1.5";

export default function StepOrgSetup({ data, update, onNext }: Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.orgName.trim()) return;
    if (!data.orgSlug) update({ orgSlug: slugify(data.orgName) });
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif text-neutral-950 mb-1">Set up your business</h2>
        <p className="text-sm text-neutral-500">This will appear on your invoices.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="orgName" className={labelClass}>Business name <span className="text-neutral-400">(required)</span></label>
          <input
            id="orgName"
            value={data.orgName}
            onChange={(e) => update({ orgName: e.target.value, orgSlug: slugify(e.target.value) })}
            placeholder="Acme Design Studio"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>Business email</label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="hello@acme.com"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="address" className={labelClass}>Address</label>
            <input
              id="address"
              value={data.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="123 Main St"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <input
              id="city"
              value={data.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="London"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="postcode" className={labelClass}>Postcode</label>
            <input
              id="postcode"
              value={data.postcode}
              onChange={(e) => update({ postcode: e.target.value })}
              placeholder="EC1A 1BB"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="vatNumber" className={labelClass}>VAT number</label>
            <input
              id="vatNumber"
              value={data.vatNumber}
              onChange={(e) => update({ vatNumber: e.target.value })}
              placeholder="GB123456789"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
      >
        Continue
      </button>
    </form>
  );
}
