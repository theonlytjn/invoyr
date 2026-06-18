import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import type { Metadata } from "next";
import type { Invoice, InvoiceItem, Client } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Invoice" };

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const [invoiceRes, clientsRes] = await Promise.all([
    supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).eq("org_id", org.id).single(),
    supabase.from("clients").select("*").eq("org_id", org.id).order("name"),
  ]);

  if (!invoiceRes.data) notFound();

  const invoice = invoiceRes.data as unknown as Invoice & { invoice_items: InvoiceItem[] };
  const clients = (clientsRes.data ?? []) as Client[];

  return (
    <div>
      <Topbar title={`Edit ${invoice.invoice_number}`} />
      <div className="p-6">
        <InvoiceForm
          org={org}
          clients={clients}
          invoice={invoice}
          existingItems={invoice.invoice_items ?? []}
          invoiceNumber={invoice.invoice_number}
          mode="edit"
        />
      </div>
    </div>
  );
}
