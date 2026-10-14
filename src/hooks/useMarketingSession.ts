"use client";

import { useEffect, useState } from "react";
import { appOriginFor } from "@/config/domains";

export type MarketingSession =
  | { status: "loading" }
  | { status: "signed-out" }
  | ({ status: "signed-in" } & AccountDetails);

export type AccountDetails = { name: string | null; email: string | null; orgName: string | null; orgLogoUrl: string | null };

// Last answer, so a signed-in visitor doesn't see "Sign in" flash on every page
// load. Holds display details only; the request below always has the final say.
const HINT_KEY = "invoyr-session-hint";

/**
 * Whether the visitor is signed in to the app, for the marketing header. The
 * marketing pages are static, so this is asked of the app domain from the browser.
 */
export function useMarketingSession() {
  const [session, setSession] = useState<MarketingSession>({ status: "loading" });
  const [appOrigin, setAppOrigin] = useState("");

  useEffect(() => {
    const origin = appOriginFor(window.location.hostname);
    setAppOrigin(origin);

    try {
      const hint = localStorage.getItem(HINT_KEY);
      if (hint) setSession({ status: "signed-in", orgName: null, orgLogoUrl: null, ...JSON.parse(hint) });
    } catch {}

    let cancelled = false;
    fetch(`${origin}/api/session`, { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { signedIn: false }))
      .then((data: { signedIn: boolean } & Partial<AccountDetails>) => {
        if (cancelled) return;
        if (data.signedIn) {
          const details: AccountDetails = {
            name: data.name ?? null,
            email: data.email ?? null,
            orgName: data.orgName ?? null,
            orgLogoUrl: data.orgLogoUrl ?? null,
          };
          setSession({ status: "signed-in", ...details });
          try { localStorage.setItem(HINT_KEY, JSON.stringify(details)); } catch {}
        } else {
          setSession({ status: "signed-out" });
          try { localStorage.removeItem(HINT_KEY); } catch {}
        }
      })
      // Can't reach the app: fall back to the signed-out header rather than nothing.
      .catch(() => { if (!cancelled) setSession({ status: "signed-out" }); });

    return () => { cancelled = true; };
  }, []);

  return { session, appOrigin };
}

export function clearMarketingSessionHint() {
  try { localStorage.removeItem(HINT_KEY); } catch {}
}
