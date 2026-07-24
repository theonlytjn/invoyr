"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Lightweight AOS-style scroll reveal. One IntersectionObserver reveals each
// section (and any [data-reveal] block) as it enters view. Reveal styles live
// in globals.css and only take effect once this effect adds `.reveal-ready`, so
// with JS disabled or not yet hydrated the content is always fully visible —
// there is no state in which content can get stuck hidden. Re-runs on route
// change since the marketing layout persists across client navigations.
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

    // Arm the reveal styles. Anything already in view is revealed in the same
    // tick so it never flashes hidden; the rest fade in on scroll.
    document.documentElement.classList.add("reveal-ready");

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

    const vh = window.innerHeight;
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.92 && rect.bottom > 0) {
        el.classList.add("is-visible");
      } else {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
