import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { Organisation, Client, Invoice } from "@/lib/supabase/types";

const STATEMENT_STATUSES = ["issued", "sent", "overdue", "paid", "partial"];

async function fetchLogoAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const [{ data: clientData }, { data: invoicesData }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).eq("org_id", org.id).single(),
    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", id)
      .eq("org_id", org.id)
      .in("status", STATEMENT_STATUSES)
      .order("issue_date", { ascending: false }),
  ]);

  if (!clientData) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const client = clientData as Client;
  const invoices = (invoicesData ?? []) as Invoice[];

  const logoRawUrl = org.logo_url ? org.logo_url.split("?")[0] : null;
  const logoDataUrl = logoRawUrl ? await fetchLogoAsDataUrl(logoRawUrl) : null;
  const orgWithLogo: Organisation & { logoDataUrl?: string | null } = { ...org, logoDataUrl };

  const statementDate = formatDate(new Date().toISOString());

  const { default: ClientStatementPdf } = await import("@/components/statements/ClientStatementPdf");
  const { renderToBuffer } = await import("@react-pdf/renderer");

  const element = ClientStatementPdf({
    org: orgWithLogo,
    client,
    invoices,
    statementDate,
    currency: org.currency ?? "GBP",
  });

  const buffer = await renderToBuffer(element);
  const uint8 = new Uint8Array(buffer);
  const filename = `statement-${client.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
