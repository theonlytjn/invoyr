"use client";

import { useEffect, useRef } from "react";

// Renders a Cloudflare Turnstile widget and reports the token via onVerify.
// If NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set, it renders nothing and the host
// form treats CAPTCHA as unconfigured (submits normally) — so this can ship
// before the keys exist and activate once they're added.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const turnstileConfigured = !!SITE_KEY;

export default function TurnstileWidget({
  onVerify,
  className,
}: {
  onVerify: (token: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerifyRef.current(token),
        "error-callback": () => onVerifyRef.current(""),
        "expired-callback": () => onVerifyRef.current(""),
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      const poll = setInterval(() => {
        if (window.turnstile) {
          clearInterval(poll);
          renderWidget();
        }
      }, 120);
      setTimeout(() => clearInterval(poll), 8000);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className={className} />;
}
