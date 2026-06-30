import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { testSmtpConnection } from "@/lib/smtp/send";

const schema = z.object({
  smtp_host: z.string().trim().min(1),
  smtp_port: z.coerce.number().int().min(1).max(65535),
  smtp_user: z.string().trim().min(1),
  smtp_password: z.string().min(1),
  smtp_from_email: z.string().email(),
  smtp_from_name: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  await requireOrg();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const result = await testSmtpConnection({
    host: parsed.data.smtp_host,
    port: parsed.data.smtp_port,
    user: parsed.data.smtp_user,
    password: parsed.data.smtp_password,
    fromName: parsed.data.smtp_from_name ?? parsed.data.smtp_from_email,
    fromEmail: parsed.data.smtp_from_email,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
