"use client";

import { useEffect, useState } from "react";

// Floating "back to top" button — fades/slides in once the page is scrolled a
// bit, then smooth-scrolls to the top. Works on all viewports incl. mobile.
export default function ScrollToTop({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={[
        "fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full shadow-lg",
        "transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        show ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none",
        className ?? "bg-neutral-50 text-neutral-950 hover:bg-white focus-visible:ring-neutral-100 focus-visible:ring-offset-neutral-950",
      ].join(" ")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </button>
  );
}
