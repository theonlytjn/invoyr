import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { StripeConnectPanel } from "@/components/settings/StripeConnectPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Payments" };

export default async function PaymentsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { connect } = await searchParams;

  const { data: freshOrg } = await supabase
    .from("organisations")
    .select("stripe_account_id")
    .eq("id", org.id)
    .single();

  const stripeAccountId = freshOrg?.stripe_account_id ?? null;

  return (
    <div className="space-y-6">
      {connect === "success" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Stripe connected successfully. Clients can now pay invoices directly to your account.
        </div>
      )}
      {connect === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          Stripe connection failed. Please try again.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Stripe account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect your Stripe account to accept card payments on invoices. Funds are transferred directly to you.
          </p>
        </div>
        <StripeConnectPanel
          connected={!!stripeAccountId}
          accountId={stripeAccountId}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">How it works</h2>
        <ol className="space-y-2.5 text-sm text-gray-600 list-none">
          {[
            "Connect your Stripe account once using the button above.",
            "Send an invoice to your client with payment enabled.",
            "Your client clicks \"Pay now\" and enters their card details.",
            "The payment goes directly to your Stripe balance.",
            "Invoyr automatically marks the invoice as paid.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
