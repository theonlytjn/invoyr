"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { Input } from "@/components/ui/input";
import type { InvoiceWithClient } from "@/lib/supabase/types";

interface Props {
  invoices: InvoiceWithClient[];
}

export default function InvoicesTable({ invoices }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? invoices.filter((inv) => {
        const q = query.toLowerCase();
        return (
          inv.invoice_number.toLowerCase().includes(q) ||
          (inv.clients?.name ?? "").toLowerCase().includes(q)
        );
      })
    : invoices;

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search by invoice number or client…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            {query ? (
              <p className="text-neutral-500">No invoices match &ldquo;{query}&rdquo;.</p>
            ) : (
              <>
                <p className="text-neutral-500 mb-3">No invoices found.</p>
                <Link href="/invoices/new" className="text-sm font-medium text-neutral-950 underline">
                  Create your first invoice
                </Link>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100">
              <tr>
                <th className="text-left py-3 px-5 text-xs font-medium text-neutral-500 uppercase tracking-wide">Invoice</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Client</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Issue date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Due date</th>
                <th className="text-right py-3 px-5 text-xs font-medium text-neutral-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-5">
                    <Link href={`/invoices/${invoice.id}`} className="font-medium text-neutral-950 hover:underline">
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">
                    {invoice.clients?.name ?? <span className="text-neutral-400 italic">No client</span>}
                  </td>
                  <td className="py-3 px-4">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{formatDate(invoice.issue_date)}</td>
                  <td className="py-3 px-4 text-neutral-600">
                    {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                  </td>
                  <td className="py-3 px-5 text-right font-medium text-neutral-950">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
