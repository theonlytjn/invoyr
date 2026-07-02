import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import ApiKeysPanel from "@/components/settings/ApiKeysPanel";
import WebhooksPanel from "@/components/settings/WebhooksPanel";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Developer — Settings" };

export default async function DeveloperSettingsPage() {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);
  const hasAccess = canAccess(plan, "api_access");

  const supabase = await createClient();

  const [{ data: keys }, { data: endpoints }] = await Promise.all([
    supabase
      .from("api_keys")
      .select("id, org_id, name, key_prefix, last_used_at, expires_at, revoked_at, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("webhook_endpoints")
      .select("id, org_id, url, events, enabled, last_triggered_at, failure_count, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">Developer</h2>
        <p className="text-sm text-neutral-500 mt-1">
          API keys for programmatic access and outbound webhooks for real-time event notifications.
        </p>
      </div>

      {!hasAccess ? (
        <UpgradePrompt feature="api_access" />
      ) : (
        <div className="space-y-10">
          <section>
            <ApiKeysPanel initialKeys={keys ?? []} />
          </section>

          <div className="border-t border-neutral-200 dark:border-neutral-800" />

          <section>
            <WebhooksPanel initialEndpoints={endpoints ?? []} />
          </section>

          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
            <h3 className="text-sm font-medium text-neutral-950 dark:text-neutral-50 mb-3">API reference</h3>
            <div className="space-y-2 text-sm">
              {[
                { method: "GET", path: "/api/v1/invoices",    desc: "List invoices (limit, offset, status)" },
                { method: "GET", path: "/api/v1/invoices/:id", desc: "Get invoice with items" },
                { method: "GET", path: "/api/v1/clients",     desc: "List clients (limit, offset)" },
                { method: "GET", path: "/api/v1/payments",    desc: "List payments (limit, offset)" },
              ].map((r) => (
                <div key={r.path} className="flex items-center gap-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {r.method}
                  </span>
                  <code className="text-xs text-neutral-600 dark:text-neutral-400 shrink-0">{r.path}</code>
                  <span className="text-xs text-neutral-500 hidden sm:block">{r.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-3">
              Authentication: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Authorization: Bearer inv_…</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
