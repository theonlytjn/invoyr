"use client";

import { Button } from "@/components/ui/button";
import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  onBack: () => void;
  onComplete: () => void;
  saving: boolean;
}

export default function StepFirstInvoice({ data, onBack, onComplete, saving }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">You&apos;re almost ready!</h2>
        <p className="mt-1 text-gray-500">
          Here&apos;s what you&apos;ll be able to do right away.
        </p>
      </div>

      <div className="space-y-3">
        {[
          { emoji: "📄", title: "Create your first invoice", desc: "Add a client and send a professional invoice in minutes." },
          { emoji: "💳", title: "Get paid online", desc: "Clients pay directly via Stripe — funds go straight to your account." },
          { emoji: "📊", title: "Track your revenue", desc: "Your dashboard shows exactly what's paid, pending, and overdue." },
        ].map((item) => (
          <div key={item.title} className="flex gap-4 p-3 rounded-lg bg-gray-50">
            <span className="text-2xl">{item.emoji}</span>
            <div>
              <p className="font-medium text-gray-900 text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
        <p>
          <strong className="text-gray-900">Business:</strong> {data.orgName}
        </p>
        <p className="mt-0.5">
          <strong className="text-gray-900">Plan:</strong>{" "}
          <span className="capitalize">{data.plan}</span> (14-day free trial)
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button className="flex-1" onClick={onComplete} disabled={saving}>
          {saving ? "Setting up…" : "Go to dashboard →"}
        </Button>
      </div>
    </div>
  );
}
