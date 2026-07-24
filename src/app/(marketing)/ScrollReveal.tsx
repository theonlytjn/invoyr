"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Lightweight AOS-style scroll reveal: one IntersectionObserver reveals each
// section (and any [data-reveal] block) as it scrolls into view. Reveal styles
// live in globals.css; this only toggles `.is-visible`. Re-runs on route change
// since the marketing layout persists across client navigations.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".marketing main > section, .marketing [data-reveal]"
      )
    );
    if (targets.length === 0) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
