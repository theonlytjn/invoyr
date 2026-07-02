import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

const schema = z.object({
  tagline: z.string().max(120).optional(),
  supportEmail: z.string().email().max(200).optional().or(z.literal("")),
  hideBranding: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { tagline, supportEmail, hideBranding } = parsed.data;

  const supabase = await createClient();
  const org = await requireOrg();

  const { error } = await supabase
    .from("organisations")
    .update({
      portal_tagline: tagline ?? null,
      portal_support_email: supportEmail || null,
      ...(hideBranding !== undefined ? { hide_invoyr_branding: hideBranding } : {}),
    })
    .eq("id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
