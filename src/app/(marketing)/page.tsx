import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-8">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Now in early access
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
          Invoicing that gets you paid faster
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Professional invoices, Stripe payments, and revenue tracking — built for freelancers,
          agencies, and service businesses.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            Start free trial
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            View pricing
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">14-day free trial · No credit card required</p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-t border-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything you need to get paid
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "📄", title: "Professional invoices", desc: "Choose from 4 beautiful templates. Add your logo, brand colour, and payment terms." },
              { icon: "💳", title: "Stripe payments", desc: "Clients pay online with a single click. Funds go directly to your Stripe account." },
              { icon: "📊", title: "Revenue dashboard", desc: "See what's paid, outstanding, and overdue at a glance. Export CSV reports anytime." },
              { icon: "🔁", title: "Recurring invoices", desc: "Set up automatic invoices for retainer clients. Never forget to bill again." },
              { icon: "📧", title: "Automated reminders", desc: "Polite reminders sent automatically at 7, 14, and 30 days overdue." },
              { icon: "👥", title: "Team access", desc: "Invite your accountant or VA with role-based permissions." },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl border border-gray-200">
                <span className="text-2xl mb-3 block">{feature.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
        <p className="text-gray-500 mb-8">Join businesses already using Invoyr to get paid on time.</p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
        >
          Start your free trial →
        </Link>
      </section>
    </div>
  );
}
