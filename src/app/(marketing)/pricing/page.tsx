import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing" };

const PLANS = [
  {
    name: "Starter",
    price: "£79",
    period: "/year",
    desc: "Perfect for freelancers and solo operators.",
    users: "1 user",
    features: [
      "Unlimited invoices",
      "Client management",
      "4 invoice templates",
      "Stripe payments",
      "PDF generation & email",
      "Basic reports",
    ],
  },
  {
    name: "Business",
    price: "£149",
    period: "/year",
    desc: "For growing agencies and small teams.",
    users: "Up to 5 users",
    popular: true,
    features: [
      "Everything in Starter",
      "Recurring invoices",
      "Automated reminders",
      "Team roles & permissions",
      "Advanced reports",
    ],
  },
  {
    name: "Pro",
    price: "£249",
    period: "/year",
    desc: "For established businesses that need everything.",
    users: "Unlimited users",
    features: [
      "Everything in Business",
      "Custom email domain",
      "Automation workflows",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-gray-500">Start free for 14 days. No credit card required.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 relative ${plan.popular ? "border-gray-900 shadow-lg" : "border-gray-200"}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                Most popular
              </span>
            )}
            <h3 className="font-bold text-xl text-gray-900">{plan.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-gray-500">{plan.period}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{plan.users}</p>
            <ul className="mt-6 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`mt-8 block w-full text-center py-2.5 rounded-xl font-medium transition-colors ${
                plan.popular
                  ? "bg-gray-900 text-white hover:bg-gray-700"
                  : "border border-gray-200 text-gray-900 hover:bg-gray-50"
              }`}
            >
              Start free trial
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mt-10">
        All plans include a 14-day free trial. Cancel anytime.
      </p>
    </div>
  );
}
