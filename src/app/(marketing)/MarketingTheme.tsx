"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Keeps the theme correct across client-side navigations (the inline no-flash
// script only runs on full page loads). Only the homepage is dual-theme for
// now: user override wins, else default by local clock (dark 7pm–7am). Every
// other marketing page stays dark until it's converted.
function nightByClock() {
  const h = new Date().getHours();
  return h >= 19 || h < 7;
}

export default function MarketingTheme() {
  const pathname = usePathname();

  useEffect(() => {
    let dark = true;
    if (pathname === "/") {
      try {
        const t = localStorage.getItem("invoyr-theme");
        dark = t === "dark" ? true : t === "light" ? false : nightByClock();
      } catch {
        dark = nightByClock();
      }
    }
    document.documentElement.classList.toggle("dark", dark);
  }, [pathname]);

  return null;
}
