import Link from "next/link";
import MarketingHeader from "./MarketingHeader";
import ScrollReveal from "./ScrollReveal";
import ScrollToTop from "@/components/ScrollToTop";
import MarketingTheme from "./MarketingTheme";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* No-flash theme. Only the homepage is dual-theme for now; other marketing
          pages stay dark. On the homepage: user override wins, else default by
          local clock (dark 7pm–7am). Theme is the `dark` class on <html>. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{var d;if(location.pathname==='/'){var t=localStorage.getItem('invoyr-theme');if(t==='dark'){d=true}else if(t==='light'){d=false}else{var h=new Date().getHours();d=(h>=19||h<7)}}else{d=true}document.documentElement.classList.toggle('dark',d)}catch(e){}})();",
        }}
      />
      <MarketingTheme />
      <ScrollReveal />
      <ScrollToTop />
      <MarketingHeader />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-200 dark:border-neutral-900">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/main-logo-flat-black.svg" alt="Invoyr" className="h-12 w-auto dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/main-logo-flat-white.svg" alt="Invoyr" className="h-12 w-auto hidden dark:block" />
            <p className="mt-4 text-base text-neutral-500 dark:text-neutral-400 max-w-[15rem]">Invoicing that gets you paid.</p>
          </div>
          <div>
            <p className="font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400 mb-4">Navigation</p>
            <ul className="space-y-2.5 text-base text-neutral-600 dark:text-neutral-200">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400 mb-4">Legal</p>
            <ul className="space-y-2.5 text-base text-neutral-600 dark:text-neutral-200">
              <li><Link href="/privacy" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400 mb-4">Get started</p>
            <ul className="space-y-2.5 text-base text-neutral-600 dark:text-neutral-200">
              <li><Link href="/signup" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">Start free trial</Link></li>
              <li><Link href="/login" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200 dark:border-neutral-900">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-6 font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            © {new Date().getFullYear()} Invoyr. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
