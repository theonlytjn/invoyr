"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Keeps the theme correct across client-side navigations (the inline no-flash
// script only runs on full page loads). The whole marketing site is dual-theme:
// an explicit user override wins, otherwise the default follows the visitor's
// local clock (dark 7pm–7am, light otherwise).
function nightByClock() {
  const h = new Date().getHours();
  return h >= 19 || h < 7;
}

export default function MarketingTheme() {
  const pathname = usePathname();

  useEffect(() => {
    let dark: boolean;
    try {
      const t = localStorage.getItem("invoyr-theme");
      dark = t === "dark" ? true : t === "light" ? false : nightByClock();
    } catch {
      dark = nightByClock();
    }
    document.documentElement.classList.toggle("dark", dark);
  }, [pathname]);

  return null;
}
