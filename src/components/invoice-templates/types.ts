import type { Client, Invoice, InvoiceItem, Organisation } from "@/lib/supabase/types";

export interface ComputedTotals {
  subtotal: number;
  vatAmount: number;
  discount?: number;
  total: number;
}

export interface InvoiceTemplateProps {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  org: Organisation;
  totals: ComputedTotals;
}
