import { buildCsv } from "./csv-utils";

// Map VAT rate → Xero TaxType (UK defaults)
function xeroTaxType(vatRate: number): string {
  if (vatRate >= 20) return "OUTPUT2";
  if (vatRate >= 5) return "OUTPUT";
  return "NONE";
}

export interface XeroInvoiceRow {
  contactName: string;
  email: string;
  invoiceNumber: string;
  reference: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  quantity: number;
  unitAmount: number;
  vatRate: number;
  currency: string;
}

export function buildXeroInvoiceCsv(rows: XeroInvoiceRow[]): string {
  const headers = [
    "*ContactName",
    "EmailAddress",
    "*InvoiceNumber",
    "Reference",
    "*InvoiceDate",
    "*DueDate",
    "*Description",
    "*Quantity",
    "*UnitAmount",
    "AccountCode",
    "*TaxType",
    "Currency",
  ];

  const dataRows = rows.map((r) => [
    r.contactName,
    r.email,
    r.invoiceNumber,
    r.reference,
    r.invoiceDate,
    r.dueDate || r.invoiceDate,
    r.description,
    r.quantity,
    r.unitAmount.toFixed(2),
    "200",
    xeroTaxType(r.vatRate),
    r.currency,
  ]);

  return buildCsv(headers, dataRows);
}

export interface XeroContactRow {
  name: string;
  email: string;
  addressLine1: string;
  city: string;
  postcode: string;
  country: string;
}

export function buildXeroContactsCsv(rows: XeroContactRow[]): string {
  const headers = [
    "*Name",
    "EmailAddress",
    "POAddressLine1",
    "POCity",
    "POPostalCode",
    "POCountry",
  ];

  const dataRows = rows.map((r) => [
    r.name,
    r.email,
    r.addressLine1,
    r.city,
    r.postcode,
    r.country,
  ]);

  return buildCsv(headers, dataRows);
}

export interface XeroExpenseRow {
  contactName: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  accountCode: string;
}

// Map expense category → Xero account code (UK standard chart of accounts)
export function categoryToXeroAccount(category: string): string {
  const map: Record<string, string> = {
    travel:       "493", // Travel - national
    software:     "404", // Computer expenses
    office:       "400", // Advertising
    meals:        "420", // Entertainment - meals
    marketing:    "400", // Advertising
    professional: "404", // Computer expenses (closest generic)
    equipment:    "404", // Computer equipment
    other:        "429", // General expenses
  };
  return map[category] ?? "429";
}

export function buildXeroExpensesCsv(rows: XeroExpenseRow[]): string {
  const headers = [
    "*ContactName",
    "*InvoiceDate",
    "*Description",
    "*Quantity",
    "*UnitAmount",
    "AccountCode",
    "*TaxType",
    "Currency",
  ];

  const dataRows = rows.map((r) => [
    r.contactName,
    r.date,
    r.description,
    "1",
    r.amount.toFixed(2),
    r.accountCode,
    "NONE",
    r.currency,
  ]);

  return buildCsv(headers, dataRows);
}
