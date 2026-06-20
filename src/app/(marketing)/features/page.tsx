import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — Invoyr",
  description: "Everything you need to invoice clients, collect payments, and run your business.",
};

const FEATURES = [
  {
    category: "Invoicing",
    items: [
      { title: "4 professional templates", desc: "Classic, minimal, bold, and studio themes — all print-ready and fully branded." },
      { title: "Your logo & colours", desc: "Upload your logo and set your brand colour once. Every invoice looks like you." },
      { title: "Custom payment terms", desc: "Set Net 7, 14, 30, or a custom due date per invoice." },
      { title: "Duplicate invoices", desc: "Copy any invoice to a new draft in one click — perfect for repeat clients." },
      { title: "PDF download", desc: "Every invoice generates a high-quality PDF you can share or archive." },
      { title: "Automatic numbering", desc: "Sequential invoice numbers with your own prefix — no manual tracking." },
    ],
  },
  {
    category: "Payments",
    items: [
      { title: "Stripe card payments", desc: "Clients pay with a single click. No Stripe account needed on their end." },
      { title: "Funds go straight to you", desc: "Payments land directly in your Stripe balance — no intermediary holding your money." },
      { title: "Manual payment recording", desc: "Received a bank transfer or cheque? Record it instantly." },
      { title: "Partial payments", desc: "Track deposits and partial payments with outstanding balance calculated automatically." },
    ],
  },
  {
    category: "Automation",
    items: [
      { title: "Overdue reminders", desc: "Polite email reminders sent automatically to clients with overdue invoices." },
      { title: "Email to client", desc: "Send invoices directly from Invoyr with a professional email and pay-now link." },
      { title: "Payment receipts", desc: "Clients automatically receive a receipt email when payment is confirmed." },
    ],
  },
  {
    category: "Reports & insights",
    items: [
      { title: "Revenue dashboard", desc: "Monthly revenue chart, outstanding totals, and overdue summary at a glance." },
      { title: "Top clients report", desc: "See which clients drive the most revenue over any period." },
      { title: "Aging report", desc: "Spot overdue invoices by 0–30, 31–60, 61–90, and 90+ day buckets." },
      { title: "VAT summary", desc: "Monthly net, VAT, and gross breakdown — ready for your accountant or VAT return." },
      { title: "CSV export", desc: "Export all invoice data as CSV for your own records or accounting software." },
    ],
  },
  {
    category: "Organisation",
    items: [
      { title: "Client directory", desc: "Full contact records with addresses, VAT numbers, and private notes." },
      { title: "Archive clients", desc: "Keep your active list clean without losing historical data." },
      { title: "Invoice search", desc: "Find any invoice by number or client name instantly." },
      { title: "Audit log", desc: "Every action is logged — who sent, paid, voided, or edited." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div>
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Built for the way you work
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Invoyr gives freelancers and service businesses everything they need to invoice professionally
          and get paid fast — without the bloat of enterprise accounting software.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            Start free trial
          </Link>
          <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900">
            View pricing →
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-14">
        {FEATURES.map((group) => (
          <section key={group.category}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-5">
              {group.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => (
                <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="bg-gray-50 border-t border-gray-100 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Everything included from day one</h2>
        <p className="text-gray-500 mb-8">14-day free trial. No credit card required.</p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
        >
          Get started free →
        </Link>
      </section>
    </div>
  );
}
