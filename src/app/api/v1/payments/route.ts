import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateApiKey } from "@/lib/api-key-auth";
import { serverError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const supabase = createServiceClient();
  const { data, error, count } = await supabase
    .from("payments")
    .select("*, invoices(invoice_number, clients(name))", { count: "exact" })
    .eq("org_id", auth.orgId)
    .order("paid_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return serverError("v1/payments: list", error);
  return NextResponse.json({ data, total: count ?? 0, limit, offset });
}
