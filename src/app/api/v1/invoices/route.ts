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
  const status = searchParams.get("status");

  const supabase = createServiceClient();
  let query = supabase
    .from("invoices")
    .select("*, clients(id, name, email, company_name), invoice_items(*)", { count: "exact" })
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) return serverError("v1/invoices: list", error);

  return NextResponse.json({ data, total: count ?? 0, limit, offset });
}
