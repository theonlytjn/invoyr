export type InvoiceStatus = "draft" | "issued" | "sent" | "paid" | "overdue" | "void";
export type InvoiceTemplate = "tjn_classic" | "clean_minimal" | "bold_split" | "modern_studio";
export type PaymentMethod = "stripe" | "bank_transfer" | "cash" | "cheque" | "other";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type OrgRole = "owner" | "admin" | "member";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  vat_number: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  accent_color: string;
  invoice_prefix: string;
  next_invoice_number: number;
  default_terms: string | null;
  default_notes: string | null;
  company_registration_number: string | null;
  vat_registered: boolean;
  default_vat_rate: number;
  currency: string;
  default_template: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_sort_code: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: number;
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  vat_number: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  client_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  template: InvoiceTemplate;
  issue_date: string;
  due_date: string | null;
  currency: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  terms: string | null;
  stripe_payment_link: string | null;
  public_token: string | null;
  sent_at: string | null;
  paid_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
  sort_order: number;
}

export interface Payment {
  id: string;
  org_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: string | null;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  org_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface EmailLog {
  id: number;
  org_id: string | null;
  user_id: string | null;
  invoice_id: string | null;
  resend_id: string | null;
  to_email: string;
  subject: string;
  template_name: string;
  status: "sent" | "delivered" | "bounced" | "failed";
  opened_at: string | null;
  created_at: string;
}

export interface EmailPreferences {
  id: string;
  user_id: string;
  marketing_consent: boolean;
  unsubscribe_token: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingContact {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  resend_contact_id: string | null;
  subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithClient extends Invoice {
  clients: Pick<Client, "id" | "name" | "email" | "company_name"> | null;
}

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
  clients: Client | null;
}

export interface PaymentWithInvoice extends Payment {
  invoices: {
    invoice_number: string;
    clients: Pick<Client, "name"> | null;
  } | null;
}

// Supabase Database type — matches the format expected by createClient<Database>
type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      organisations: TableDef<Organisation>;
      org_members: TableDef<OrgMember>;
      clients: TableDef<Client>;
      invoices: TableDef<Invoice>;
      invoice_items: TableDef<InvoiceItem>;
      payments: TableDef<Payment>;
      subscriptions: TableDef<Subscription>;
      audit_logs: TableDef<AuditLog>;
      email_logs: TableDef<EmailLog>;
      email_preferences: TableDef<EmailPreferences>;
      marketing_contacts: TableDef<MarketingContact>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      invoice_status: InvoiceStatus;
      invoice_template: InvoiceTemplate;
      payment_method: PaymentMethod;
      subscription_status: SubscriptionStatus;
    };
  };
};
