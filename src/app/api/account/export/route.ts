import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = await createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id, role, created_at")
    .eq("user_id", user.id);

  const orgIds = (memberships ?? []).map((m) => m.org_id);

  const [orgsRes, clientsRes, invoicesRes, paymentsRes, emailPrefsRes, emailLogsRes] =
    await Promise.all([
      orgIds.length
        ? supabase.from("organisations").select("id, name, email, invoice_prefix, created_at").in("id", orgIds)
        : Promise.resolve({ data: [] }),
      orgIds.length
        ? supabase.from("clients").select("id, org_id, name, email, company_name, phone, address_line1, city, postcode, country, vat_number, notes, created_at").in("org_id", orgIds)
        : Promise.resolve({ data: [] }),
      orgIds.length
        ? supabase.from("invoices").select("id, org_id, invoice_number, status, issue_date, due_date, currency, subtotal, vat_amount, total, amount_paid, paid_at, created_at").in("org_id", orgIds)
        : Promise.resolve({ data: [] }),
      orgIds.length
        ? supabase.from("payments").select("id, org_id, invoice_id, amount, currency, method, paid_at").in("org_id", orgIds)
        : Promise.resolve({ data: [] }),
      supabase.from("email_preferences").select("marketing_consent, unsubscribed_at, created_at").eq("user_id", user.id),
      orgIds.length
        ? supabase.from("email_logs").select("to_email, subject, template_name, status, created_at").in("org_id", orgIds)
        : Promise.resolve({ data: [] }),
    ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile: profile ?? null,
    organisations: orgsRes.data ?? [],
    memberships: memberships ?? [],
    clients: clientsRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    payments: paymentsRes.data ?? [],
    email_preferences: emailPrefsRes.data?.[0] ?? null,
    email_logs: emailLogsRes.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="invoyr-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
