import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { success } = await rateLimit("pay-checkout", clientIp(req), 10, 60);
  if (!success) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });

  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, org_id, invoice_number, total, amount_paid, currency, status, late_fee_amount, credit_applied, clients(email)")
    .eq("public_token", token)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "paid") return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
  if (invoice.status === "void") return NextResponse.json({ error: "Invoice is void" }, { status: 400 });

  const lateFeeAmount = (invoice as { late_fee_amount?: number }).late_fee_amount ?? 0;
  const creditApplied = (invoice as { credit_applied?: number }).credit_applied ?? 0;
  const amountDue = Math.round((invoice.total + lateFeeAmount - invoice.amount_paid - creditApplied) * 100);
  if (amountDue <= 0) return NextResponse.json({ error: "Nothing due" }, { status: 400 });

  const { data: org } = await supabase
    .from("organisations")
    .select("name, stripe_account_id")
    .eq("id", invoice.org_id)
    .single();

  if (!org?.stripe_account_id) {
    return NextResponse.json(
      { error: "This organisation has not connected a Stripe account yet." },
      { status: 400 }
    );
  }

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  /**
   * A DIRECT charge: the session is created ON the business's own Stripe
   * account, not on Invoyr's.
   *
   * This previously used a destination charge — the payment landed on the
   * platform and was transferred onward — which made Invoyr the merchant of
   * record and therefore liable for chargebacks on invoices it had nothing to
   * do with. Now the business is the merchant: their name on the statement,
   * Stripe's fees from their balance, and their dispute to answer.
   */
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: amountDue,
          product_data: {
            name: `Invoice ${invoice.invoice_number}`,
            description: org.name ? `From ${org.name}` : undefined,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: client?.email ?? undefined,

    metadata: {
      invoice_id: invoice.id,
      org_id: invoice.org_id,
    },
    success_url: `${appUrl}/pay/${token}?paid=1`,
    cancel_url: `${appUrl}/pay/${token}`,
  }, {
    stripeAccount: org.stripe_account_id,
  });

  return NextResponse.json({ url: session.url });
}
