import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, expires_at, revoked_at, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  const raw = `inv_${randomBytes(20).toString("hex")}`; // inv_ + 40 hex = 44 chars
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const keyPrefix = raw.slice(0, 12); // "inv_" + first 8 chars

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      org_id: org.id,
      name: parsed.data.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      expires_at: parsed.data.expiresAt ?? null,
    })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return full key only once
  return NextResponse.json({ data, fullKey: raw });
}
