import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import Topbar from "@/components/shell/Topbar";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Invoice" };

export default async function NewInvoicePage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const [{ data: clients }, invoiceNumber] = await Promise.all([
    supabase.from("clients").select("*").eq("org_id", org.id).order("name"),
    generateInvoiceNumber(org.id),
  ]);

  return (
    <div>
      <Topbar title="New invoice" />
      <div className="p-6">
        <InvoiceForm
          org={org}
          clients={clients ?? []}
          invoiceNumber={invoiceNumber}
          mode="create"
        />
      </div>
    </div>
  );
}
