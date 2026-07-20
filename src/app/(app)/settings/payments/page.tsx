import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import { StripeConnectPanel } from "@/components/settings/StripeConnectPanel";
import { PayPalSettingsPanel } from "@/components/settings/PayPalSettingsPanel";
import { StripeLogo, PaypalLogo } from "@phosphor-icons/react/dist/ssr";
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

  const plan = await getOrgPlan(org.id);
  const canPaypal = canAccess(plan, "paypal_payments");

  const { data: freshOrg } = await supabase
    .from("organisations")
    .select("stripe_account_id, paypal_email")
    .eq("id", org.id)
    .single();

  const stripeAccountId = freshOrg?.stripe_account_id ?? null;
  const paypalEmail = freshOrg?.paypal_email ?? null;

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

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#635BFF" }}>
            <StripeLogo size={20} color="white" weight="fill" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">Stripe</h2>
            <p className="text-sm text-neutral-500">
              Accept card payments directly on invoices.
            </p>
          </div>
        </div>
        <StripeConnectPanel
          connected={!!stripeAccountId}
          accountId={stripeAccountId}
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#003087" }}>
            <PaypalLogo size={20} color="white" weight="fill" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">PayPal</h2>
            <p className="text-sm text-neutral-500">
              Accept PayPal payments directly on invoices.
            </p>
          </div>
        </div>
        {canPaypal ? (
          <PayPalSettingsPanel orgId={org.id} initialEmail={paypalEmail} />
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 p-5 text-center">
            <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
              PayPal is a Business feature. Stripe card payments are included on every plan —
              upgrade to Business to also accept PayPal.
            </p>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Upgrade to Business
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
        <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">How it works</h2>
        <ol className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400 list-none">
          {[
            "Connect your Stripe account once using the button above.",
            "Send an invoice to your client with payment enabled.",
            "Your client clicks \"Pay now\" and enters their card details.",
            "The payment goes directly to your Stripe balance.",
            "Invoyr automatically marks the invoice as paid.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
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
