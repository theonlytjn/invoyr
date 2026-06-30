import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

const schema = z.object({
  smtp_host: z.string().trim().max(255).nullable().optional(),
  smtp_port: z.coerce.number().int().min(1).max(65535).nullable().optional(),
  smtp_user: z.string().trim().max(255).nullable().optional(),
  smtp_password: z.string().max(500).nullable().optional(),
  smtp_from_name: z.string().trim().max(255).nullable().optional(),
  smtp_from_email: z.string().email().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const org = await requireOrg();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organisations")
    .update({
      smtp_host: parsed.data.smtp_host ?? null,
      smtp_port: parsed.data.smtp_port ?? null,
      smtp_user: parsed.data.smtp_user ?? null,
      smtp_password: parsed.data.smtp_password ?? null,
      smtp_from_name: parsed.data.smtp_from_name ?? null,
      smtp_from_email: parsed.data.smtp_from_email ?? null,
    })
    .eq("id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
