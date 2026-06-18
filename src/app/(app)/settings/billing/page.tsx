import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", org.id)
    .single();

  return (
    <div>
      <Topbar title="Billing" />
      <div className="p-6 max-w-xl space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Current plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 capitalize">
                {subscription?.status ?? "Trialing"}
              </p>
              {subscription?.trial_ends_at && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString("en-GB")}
                </p>
              )}
            </div>
            <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full capitalize">
              {subscription?.status ?? "trialing"}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-sm text-gray-600">
          <p>To manage your subscription, upgrade, or cancel, please visit your billing portal.</p>
          <p className="mt-2 text-xs text-gray-400">Billing portal integration coming soon.</p>
        </div>
      </div>
    </div>
  );
}
