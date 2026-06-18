import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceId } = await req.json();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(*)")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: orgRow } = await supabase
    .from("org_members")
    .select("organisations(*)")
    .eq("user_id", user.id)
    .single();

  const org = Array.isArray(orgRow?.organisations)
    ? orgRow.organisations[0]
    : orgRow?.organisations;

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const amountCents = Math.round((invoice.total - invoice.amount_paid) * 100);

  const session = await getStripe().checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            unit_amount: amountCents,
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `${org?.name ?? ""} invoice`,
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}?paid=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`,
    },
    org?.stripe_account_id
      ? { stripeAccount: org.stripe_account_id }
      : undefined
  );

  return NextResponse.json({ url: session.url });
}
