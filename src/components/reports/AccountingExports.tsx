"use client";

import { useState } from "react";
import { DownloadIcon } from "@/components/icons";

const PRESETS = [
  { label: "This month",    getDates: () => thisMonth() },
  { label: "Last month",    getDates: () => lastMonth() },
  { label: "This quarter",  getDates: () => thisQuarter() },
  { label: "This year",     getDates: () => thisYear() },
  { label: "All time",      getDates: () => ({ from: "", to: "" }) },
];

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmt(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function thisMonth() {
  const n = new Date();
  return { from: fmt(new Date(n.getFullYear(), n.getMonth(), 1)), to: fmt(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
}
function lastMonth() {
  const n = new Date();
  return { from: fmt(new Date(n.getFullYear(), n.getMonth() - 1, 1)), to: fmt(new Date(n.getFullYear(), n.getMonth(), 0)) };
}
function thisQuarter() {
  const n = new Date();
  const q = Math.floor(n.getMonth() / 3);
  return { from: fmt(new Date(n.getFullYear(), q * 3, 1)), to: fmt(new Date(n.getFullYear(), q * 3 + 3, 0)) };
}
function thisYear() {
  const n = new Date();
  return { from: `${n.getFullYear()}-01-01`, to: `${n.getFullYear()}-12-31` };
}

function buildUrl(base: string, from: string, to: string) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  return `${base}${p.toString() ? `?${p}` : ""}`;
}

const XERO_COLOR = "#13B5EA";
const QBO_COLOR = "#2CA01C";

export default function AccountingExports() {
  const [preset, setPreset] = useState("This year");
  const [from, setFrom] = useState(thisYear().from);
  const [to, setTo] = useState(thisYear().to);

  function applyPreset(label: string, getDates: () => { from: string; to: string }) {
    setPreset(label);
    const { from: f, to: t } = getDates();
    setFrom(f);
    setTo(t);
  }

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div>
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Date range</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.label, p.getDates)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                preset === p.label
                  ? "bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950"
                  : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-neutral-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPreset("Custom"); }}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-neutral-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPreset("Custom"); }}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            />
          </div>
        </div>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Xero */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: XERO_COLOR }}>
            <svg viewBox="0 0 48 48" width="28" height="28" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.15" />
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="15">Xero</text>
            </svg>
            <span className="text-white font-semibold text-sm">Xero</span>
          </div>
          <div className="p-4 space-y-2">
            <DownloadRow label="Invoices" href={buildUrl("/api/exports/xero?type=invoices", from, to)} />
            <DownloadRow label="Contacts" href={buildUrl("/api/exports/xero?type=contacts", from, to)} />
            <DownloadRow label="Expenses" href={buildUrl("/api/exports/xero?type=expenses", from, to)} />
            <p className="text-xs text-neutral-400 pt-1">
              Import via Xero → Accounting → Import &amp; Export
            </p>
          </div>
        </div>

        {/* QuickBooks */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: QBO_COLOR }}>
            <svg viewBox="0 0 48 48" width="28" height="28" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.15" />
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="10">QBO</text>
            </svg>
            <span className="text-white font-semibold text-sm">QuickBooks Online</span>
          </div>
          <div className="p-4 space-y-2">
            <DownloadRow label="Invoices" href={buildUrl("/api/exports/quickbooks?type=invoices", from, to)} />
            <DownloadRow label="Customers" href={buildUrl("/api/exports/quickbooks?type=customers", from, to)} />
            <DownloadRow label="Expenses" href={buildUrl("/api/exports/quickbooks?type=expenses", from, to)} />
            <p className="text-xs text-neutral-400 pt-1">
              Import via QuickBooks → Settings → Import Data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DownloadRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      download
      className="flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-100 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
    >
      <span>{label}</span>
      <DownloadIcon size={15} className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
    </a>
  );
}
