"use client";

import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}

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
        <h2 className="text-2xl font-semibold text-gray-900">Set up your business</h2>
        <p className="mt-1 text-gray-500">This will appear on your invoices.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgName">Business name *</Label>
          <Input
            id="orgName"
            value={data.orgName}
            onChange={(e) => {
              update({ orgName: e.target.value, orgSlug: slugify(e.target.value) });
            }}
            placeholder="Acme Design Studio"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Business email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="hello@acme.com"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={data.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="123 Main St"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="London"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              value={data.postcode}
              onChange={(e) => update({ postcode: e.target.value })}
              placeholder="EC1A 1BB"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatNumber">VAT number</Label>
            <Input
              id="vatNumber"
              value={data.vatNumber}
              onChange={(e) => update({ vatNumber: e.target.value })}
              placeholder="GB123456789"
            />
          </div>
        </div>
      </div>
      <Button type="submit" className="w-full">Continue</Button>
    </form>
  );
}
