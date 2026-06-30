import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

const schema = z.object({
  paypalEmail: z.string().email().nullable().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const paypalEmail = parsed.data.paypalEmail || null;

  const { error } = await supabase
    .from("organisations")
    .update({ paypal_email: paypalEmail })
    .eq("id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
