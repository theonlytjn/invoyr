import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { composeSchema, sendInvoiceEmail } from "@/lib/invoices/send-invoice-email";

/**
 * Sends the invoice to its client. The body is the optional compose box:
 * `{ subject?, message?, cc? }`. An empty body sends the standard email.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.text();
  let body: unknown = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }
  const parsed = composeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const result = await sendInvoiceEmail(supabase, id, { compose: parsed.data, source: "manual" });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ ok: true, to: result.to, cc: result.cc });
}
