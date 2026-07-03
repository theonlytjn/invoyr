import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getValidToken, getTransactions } from "@/lib/truelayer/client";
import type { BankConnection } from "@/lib/supabase/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  // Fetch the connection — ensure it belongs to this org
  const { data: connection, error: connErr } = await supabase
    .from("bank_connections")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (connErr || !connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // Get a valid access token, refreshing if needed
  const accessToken = await getValidToken(
    connection as BankConnection,
    async (tokens) => {
      await supabase
        .from("bank_connections")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq("id", id);
    },
  );

  // Fetch last 90 days of transactions
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const transactions = await getTransactions(accessToken, connection.account_id, from, to);

  // Only store debits (negative amounts = money leaving the account = expenses)
  const debits = transactions.filter((t) => t.amount < 0);

  if (debits.length > 0) {
    const rows = debits.map((t) => ({
      org_id: org.id,
      connection_id: id,
      transaction_id: t.transaction_id,
      date: t.timestamp.slice(0, 10),
      description: t.description,
      amount: Math.abs(t.amount),
      currency: t.currency,
      merchant_name: t.merchant_name ?? null,
      transaction_category: t.transaction_category ?? null,
    }));

    await supabase
      .from("bank_transactions")
      .upsert(rows, { onConflict: "connection_id,transaction_id", ignoreDuplicates: true });
  }

  // Update last_synced_at
  await supabase
    .from("bank_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", id);

  // Return count of pending (not yet imported) transactions
  const { count } = await supabase
    .from("bank_transactions")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", id)
    .is("expense_id", null);

  return NextResponse.json({ ok: true, synced: debits.length, pending: count ?? 0 });
}
