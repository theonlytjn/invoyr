import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const [
    { count: userCount },
    { count: orgCount },
    { data: subs },
    { count: invoiceCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("organisations").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("plan, status"),
    supabase.from("invoices").select("id", { count: "exact", head: true }),
  ]);

  const activeSubs = subs?.filter((s) => s.status === "active").length ?? 0;
  const planBreakdown: Record<string, number> = {};
  subs?.forEach((s) => {
    const key = s.plan ?? "free";
    planBreakdown[key] = (planBreakdown[key] ?? 0) + 1;
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-neutral-950 dark:text-neutral-50">Admin overview</h1>
        <p className="text-neutral-500 mt-1 text-sm">System-wide stats across all organisations.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total users", value: userCount ?? 0 },
          { label: "Organisations", value: orgCount ?? 0 },
          { label: "Active plans", value: activeSubs },
          { label: "Total invoices", value: invoiceCount ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <p className="text-xs text-neutral-400 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-3xl font-serif text-neutral-950 dark:text-neutral-50">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
        <h2 className="text-xs font-semibold text-neutral-400 mb-4 uppercase tracking-wider">Subscription breakdown</h2>
        {Object.keys(planBreakdown).length === 0 ? (
          <p className="text-neutral-400 text-sm">No subscriptions yet.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(planBreakdown).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <span className="text-sm text-neutral-950 dark:text-neutral-50 capitalize">{plan}</span>
                <span className="text-sm text-neutral-400">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
