"use client";

import { useEffect } from "react";

// The marketing site is dark-only; there is no visitor toggle. The inline
// script in the layout sets `dark` before first paint, but the root
// next-themes provider (defaultTheme "system", for the app) re-applies the
// visitor's system theme after hydration and whenever it changes. So while a
// marketing page is mounted we hold <html> in dark mode, putting it back each
// time next-themes touches it. Leaving the marketing layout disconnects the
// observer and next-themes takes over again.
function forceDark() {
  const root = document.documentElement;
  if (root.classList.contains("light")) root.classList.remove("light");
  if (!root.classList.contains("dark")) root.classList.add("dark");
  if (root.style.colorScheme !== "dark") root.style.colorScheme = "dark";
}

export default function MarketingTheme() {
  useEffect(() => {
    forceDark();
    const observer = new MutationObserver(forceDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => observer.disconnect();
  }, []);

  return null;
}
