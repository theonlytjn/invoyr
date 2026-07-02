"use client";

import { useEffect, useState } from "react";

export function PwaRegistration() {
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }

    // Show iOS install hint for Safari users who aren't in standalone mode
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode =
      "standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone;
    const dismissed = sessionStorage.getItem("ios-install-dismissed");

    if (isIos && !isInStandaloneMode && !dismissed) {
      // Slight delay so it doesn't flash on first load
      const t = setTimeout(() => setShowIosHint(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem("ios-install-dismissed", "1");
    setShowIosHint(false);
  }

  if (!showIosHint) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="" className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Install Invoyr
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Tap{" "}
              <span className="inline-flex items-center gap-0.5 font-medium text-neutral-700 dark:text-neutral-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4m0 0L8 6m4-4v13" />
                </svg>
                Share
              </span>{" "}
              then <span className="font-medium text-neutral-700 dark:text-neutral-300">Add to Home Screen</span>.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-0.5"
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
