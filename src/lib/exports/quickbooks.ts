import { buildCsv } from "./csv-utils";

export interface QboInvoiceRow {
  invoiceNo: string;
  customer: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  quantity: number;
  rate: number;
  vatRate: number;
  currency: string;
}

export function buildQboInvoiceCsv(rows: QboInvoiceRow[]): string {
  const headers = [
    "InvoiceNo",
    "Customer",
    "InvoiceDate",
    "DueDate",
    "Item(Product/Service)",
    "ItemDescription",
    "ItemQuantity",
    "ItemRate",
    "ItemTaxCode",
    "Currency",
  ];

  const dataRows = rows.map((r) => [
    r.invoiceNo,
    r.customer,
    r.invoiceDate,
    r.dueDate || r.invoiceDate,
    "Service",
    r.description,
    r.quantity,
    r.rate.toFixed(2),
    r.vatRate > 0 ? "TAX" : "NON",
    r.currency,
  ]);

  return buildCsv(headers, dataRows);
}

export interface QboCustomerRow {
  displayName: string;
  companyName: string;
  email: string;
  billingStreet: string;
  billingCity: string;
  billingPostcode: string;
  billingCountry: string;
}

export function buildQboCustomersCsv(rows: QboCustomerRow[]): string {
  const headers = [
    "Customer Display Name",
    "Company Name",
    "Email",
    "Billing Street",
    "Billing City",
    "Billing Postal Code",
    "Billing Country",
  ];

  const dataRows = rows.map((r) => [
    r.displayName,
    r.companyName,
    r.email,
    r.billingStreet,
    r.billingCity,
    r.billingPostcode,
    r.billingCountry,
  ]);

  return buildCsv(headers, dataRows);
}

export interface QboExpenseRow {
  txnDate: string;
  vendor: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
}

// Map expense category → QuickBooks account name
export function categoryToQboAccount(category: string): string {
  const map: Record<string, string> = {
    travel:       "Travel",
    software:     "Computer and Internet Expenses",
    office:       "Office Supplies & Materials",
    meals:        "Meals and Entertainment",
    marketing:    "Advertising/Promotional",
    professional: "Professional Fees",
    equipment:    "Equipment Rental",
    other:        "Other Business Expenses",
  };
  return map[category] ?? "Other Business Expenses";
}

export function buildQboExpensesCsv(rows: QboExpenseRow[]): string {
  const headers = [
    "TxnDate",
    "Vendor/Payee",
    "Description",
    "Account",
    "Amount",
    "Currency",
  ];

  const dataRows = rows.map((r) => [
    r.txnDate,
    r.vendor,
    r.description,
    r.category,
    r.amount.toFixed(2),
    r.currency,
  ]);

  return buildCsv(headers, dataRows);
}
