"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// AOS-style scroll reveal. For every section past the hero (and any explicit
// [data-reveal] block) we tag its content blocks — descending one level into a
// wrapper, and cascading grid cards individually — with `.reveal-scroll` and a
// staggered transition-delay, then reveal each element as it scrolls into view.
// A rAF-throttled scroll/resize listener drives it (more predictable than an
// IntersectionObserver, which can be throttled in some contexts). In-view
// content is revealed immediately on load so nothing can get stuck hidden.
// Styles live in globals.css; this only toggles classes. Re-runs on route
// change since the marketing layout persists.
const STEP = 90; // ms between staggered elements

function isEl(node: Node): node is HTMLElement {
  return node instanceof HTMLElement;
}

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Page components render inside a wrapping <div>, so sections are
    // `main > div > section` — use a descendant selector, not a direct child.
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".marketing main section")
    ).slice(1); // keep the hero (first section) — it has its own load motion
    const optIns = Array.from(
      document.querySelectorAll<HTMLElement>(".marketing [data-reveal]")
    );
    const parents = [...sections, ...optIns];
    if (parents.length === 0) return;

    // Ordered list of elements to reveal for a parent.
    const groupFor = (parent: HTMLElement): HTMLElement[] => {
      let kids = Array.from(parent.children).filter(isEl);
      if (kids.length === 1 && kids[0].tagName === "DIV") {
        kids = Array.from(kids[0].children).filter(isEl);
      }
      const group: HTMLElement[] = [];
      for (const el of kids) {
        const isGrid = typeof el.className === "string" && el.className.includes("grid");
        if (isGrid && el.children.length > 1) {
          group.push(...Array.from(el.children).filter(isEl));
        } else {
          group.push(el);
        }
      }
      return group.filter((el) => {
        const pos = getComputedStyle(el).position;
        return pos !== "absolute" && pos !== "fixed";
      });
    };

    // Arm every target: hide it and stamp its stagger delay.
    let items: HTMLElement[] = [];
    for (const parent of parents) {
      const group = groupFor(parent);
      group.forEach((el, i) => {
        el.classList.add("reveal-scroll");
        el.style.transitionDelay = `${i * STEP}ms`;
      });
      items = items.concat(group);
    }
    if (items.length === 0) return;

    document.documentElement.classList.add("reveal-ready");

    let ticking = false;
    const reveal = () => {
      ticking = false;
      const vh = window.innerHeight;
      items = items.filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) {
          el.classList.add("is-visible");
          return false; // done — drop it
        }
        return true;
      });
      if (items.length === 0) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(reveal);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onScroll);
    reveal(); // reveal whatever is already in view on load

    // Re-check after late layout shifts (fonts/images) — important on mobile,
    // where the initial in-view measurement can be off.
    const t1 = window.setTimeout(reveal, 300);
    const t2 = window.setTimeout(reveal, 900);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", onScroll);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}
