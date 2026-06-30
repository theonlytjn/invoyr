import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  category: z.enum(["travel","software","office","meals","marketing","professional","equipment","other"]),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3).default("GBP"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  client_id: z.string().uuid().nullable().optional(),
  receipt_url: z.string().url().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  is_billable: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const category = searchParams.get("category");
  const clientId = searchParams.get("client_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("expenses")
    .select("*, clients(id, name, company_name)")
    .eq("org_id", org.id)
    .order("date", { ascending: false });

  if (category && category !== "all") query = query.eq("category", category);
  if (clientId) query = query.eq("client_id", clientId);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data });
}

export async function POST(req: NextRequest) {
  const org = await requireOrg();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...parsed.data, org_id: org.id })
    .select("*, clients(id, name, company_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data }, { status: 201 });
}
