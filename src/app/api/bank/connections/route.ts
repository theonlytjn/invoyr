import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

export async function GET() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bank_connections")
    .select("id, account_id, account_name, account_type, currency, last_synced_at, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connections: data });
}
