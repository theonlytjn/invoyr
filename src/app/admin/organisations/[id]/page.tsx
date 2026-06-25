"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  country: string;
  vat_number: string | null;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  subscription: { plan: string | null; status: string } | null;
  memberCount: number;
}

const PLANS = ["free", "starter", "pro", "business"];
const STATUSES = ["active", "trialing", "past_due", "canceled", "incomplete"];

export default function AdminOrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState<string>("active");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/organisations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrg(d.org);
        setPlan(d.org?.subscription?.plan ?? "free");
        setStatus(d.org?.subscription?.status ?? "active");
        setLoading(false);
      });
  }, [id]);

  function handleSaveSub() {
    setSaveError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/organisations/${id}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.error ?? "Save failed");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    startTransition(async () => {
      await fetch(`/api/admin/organisations/${id}/delete`, { method: "DELETE" });
      router.push("/admin/organisations");
    });
  }

  if (loading) return <div className="p-8 text-neutral-400">Loading…</div>;
  if (!org) return <div className="p-8 text-neutral-500">Organisation not found.</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/organisations" className="text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 text-sm">← Organisations</Link>
      </div>

      <h1 className="text-xl font-serif text-neutral-950 dark:text-neutral-50 mb-1">{org.name}</h1>
      <p className="text-neutral-400 text-sm mb-8">ID: {org.id}</p>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-6 space-y-3">
        <Row label="Email" value={org.email ?? "—"} />
        <Row label="Country" value={org.country} />
        <Row label="VAT number" value={org.vat_number ?? "—"} />
        <Row label="Stripe account" value={org.stripe_account_id ?? "Not connected"} />
        <Row label="Members" value={String(org.memberCount)} />
        <Row label="Created" value={new Date(org.created_at).toLocaleString("en-GB")} />
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-6">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Override subscription</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wider">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:border-neutral-400"
            >
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wider">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:border-neutral-400"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={handleSaveSub}
          disabled={isPending}
          className="px-4 py-2 bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {saved ? "Saved!" : isPending ? "Saving…" : "Save subscription"}
        </button>
        {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
      </div>

      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-6">
        <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Danger zone</h2>
        <p className="text-neutral-500 text-sm mb-4">
          Permanently delete this organisation and all its data — invoices, clients, payments, audit logs.
        </p>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting…" : deleteConfirm ? "Confirm delete" : "Delete organisation"}
        </button>
        {deleteConfirm && !isPending && (
          <button onClick={() => setDeleteConfirm(false)} className="ml-3 text-sm text-neutral-400 hover:text-neutral-950">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-xs text-neutral-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-neutral-950 dark:text-neutral-50">{value}</span>
    </div>
  );
}
