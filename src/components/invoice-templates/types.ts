import type { Client, Invoice, InvoiceItem, Organisation } from "@/lib/supabase/types";

export interface ComputedTotals {
  subtotal: number;
  vatAmount: number;
  discount?: number;
  total: number;
  lateFeeAmount?: number;
}

export interface InvoiceTemplateProps {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  org: Organisation;
  totals: ComputedTotals;
  documentType?: "invoice" | "estimate";
  watermark?: string;
  /** Whether to render the "Powered by Invoyr" badge. Defaults to true; set false for Business+ (white_label). */
  showInvoyrBranding?: boolean;
}
