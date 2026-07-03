import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const org = await requireOrg();
  const { searchParams } = new URL(req.url);
  const connectionId = searchParams.get("connection_id");

  if (!connectionId) {
    return NextResponse.json({ error: "connection_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bank_transactions")
    .select("id, date, description, merchant_name, amount, currency, transaction_category")
    .eq("org_id", org.id)
    .eq("connection_id", connectionId)
    .is("expense_id", null)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data });
}
