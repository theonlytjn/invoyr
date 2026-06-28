"use client";

import { useState } from "react";

interface Props {
  estimateId: string;
  accentColor: string;
}

export default function EstimateDecisionButtons({ estimateId, accentColor }: Props) {
  const [status, setStatus] = useState<"idle" | "approving" | "rejecting" | "approved" | "rejected">("idle");

  async function handleApprove() {
    setStatus("approving");
    const res = await fetch(`/api/estimates/${estimateId}/approve`, { method: "POST" });
    setStatus(res.ok ? "approved" : "idle");
  }

  async function handleReject() {
    if (!confirm("Are you sure you want to decline this estimate?")) return;
    setStatus("rejecting");
    const res = await fetch(`/api/estimates/${estimateId}/reject`, { method: "POST" });
    setStatus(res.ok ? "rejected" : "idle");
  }

  if (status === "approved") {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">Estimate approved</p>
        <p className="text-sm text-gray-500 mt-1">Thank you! We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">Estimate declined</p>
        <p className="text-sm text-gray-500 mt-1">We&apos;ve recorded your response. Feel free to get in touch.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={handleApprove}
        disabled={status !== "idle"}
        className="flex-1 py-2.5 px-4 rounded-lg text-white font-medium text-sm transition-opacity disabled:opacity-60"
        style={{ backgroundColor: accentColor }}
      >
        {status === "approving" ? "Approving…" : "Approve estimate"}
      </button>
      <button
        onClick={handleReject}
        disabled={status !== "idle"}
        className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {status === "rejecting" ? "Declining…" : "Decline"}
      </button>
    </div>
  );
}
