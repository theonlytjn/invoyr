import Link from "next/link";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-30 border-b border-neutral-900/80 bg-neutral-950/70 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Invoyr home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/main-logo-dark.svg" alt="Invoyr" className="h-12 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-base text-neutral-400">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-neutral-100 transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-base text-neutral-400 hover:text-neutral-100 transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-base font-medium text-neutral-950 bg-neutral-50 hover:bg-white px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-900">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/main-logo-dark.svg" alt="Invoyr" className="h-12 w-auto" />
            <p className="mt-4 text-base text-neutral-500 max-w-[15rem]">Invoicing that gets you paid.</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500 mb-4">Navigation</p>
            <ul className="space-y-2.5 text-base text-neutral-400">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-neutral-100 transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500 mb-4">Legal</p>
            <ul className="space-y-2.5 text-base text-neutral-400">
              <li><Link href="/privacy" className="hover:text-neutral-100 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-neutral-100 transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-neutral-100 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500 mb-4">Get started</p>
            <ul className="space-y-2.5 text-base text-neutral-400">
              <li><Link href="/signup" className="hover:text-neutral-100 transition-colors">Start free trial</Link></li>
              <li><Link href="/login" className="hover:text-neutral-100 transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-900">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-6 font-mono text-xs uppercase tracking-[0.14em] text-neutral-600">
            © {new Date().getFullYear()} Invoyr. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
