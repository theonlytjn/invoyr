"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// AOS-style scroll reveal. For every section past the hero (and any explicit
// [data-reveal] block) we tag its content blocks — descending one level into a
// wrapper, and cascading grid cards individually — with `.reveal-scroll` and a
// staggered transition-delay, then reveal the whole group as it enters view.
// Absolutely-positioned decorative elements are skipped so their layout
// transforms aren't clobbered. Styles live in globals.css; this only toggles
// classes. Re-runs on route change since the marketing layout persists.
const STEP = 70; // ms between staggered elements

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

    // Build the ordered list of elements to reveal for a parent.
    const groupFor = (parent: HTMLElement): HTMLElement[] => {
      let kids = Array.from(parent.children).filter(isEl);
      // Descend through a single wrapper div (e.g. the section's container).
      if (kids.length === 1 && kids[0].tagName === "DIV") {
        kids = Array.from(kids[0].children).filter(isEl);
      }
      const group: HTMLElement[] = [];
      for (const el of kids) {
        const isGrid = typeof el.className === "string" && el.className.includes("grid");
        // Cascade grid cards individually; otherwise reveal the block as one.
        if (isGrid && el.children.length > 1) {
          group.push(...Array.from(el.children).filter(isEl));
        } else {
          group.push(el);
        }
      }
      // Skip absolutely-positioned decorative elements (bleeding mockups, glows)
      // whose own transforms would be overridden by the reveal transform.
      return group.filter((el) => {
        const pos = getComputedStyle(el).position;
        return pos !== "absolute" && pos !== "fixed";
      });
    };

    const groups = new Map<Element, HTMLElement[]>();
    for (const parent of parents) {
      const group = groupFor(parent);
      if (group.length === 0) continue;
      groups.set(parent, group);
      group.forEach((el, i) => {
        el.classList.add("reveal-scroll");
        el.style.transitionDelay = `${i * STEP}ms`;
      });
    }
    if (groups.size === 0) return;

    document.documentElement.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            groups.get(entry.target)?.forEach((el) => el.classList.add("is-visible"));
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    // Anything already in view is revealed synchronously (no flash); the rest
    // cascade in on scroll.
    const vh = window.innerHeight;
    for (const [parent, group] of groups) {
      const rect = (parent as HTMLElement).getBoundingClientRect();
      if (rect.top < vh * 0.92 && rect.bottom > 0) {
        group.forEach((el) => el.classList.add("is-visible"));
      } else {
        observer.observe(parent);
      }
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
