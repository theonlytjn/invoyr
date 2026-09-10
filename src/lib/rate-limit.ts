import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Distributed rate limiting backed by Upstash Redis. Fail-open when Upstash is
// not configured (no env vars) so local dev / preview isn't blocked — set
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in prod to enable it.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

// One limiter instance per (limit, window) config, created lazily and cached.
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${limit}:${windowSeconds}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "invoyr:rl",
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// Best-effort client IP from the platform headers (Vercel sets x-forwarded-for).
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** The shape we depend on, so the fail-open behaviour can be tested with a stub. */
type Limiter = { limit: (key: string) => Promise<{ success: boolean }> };

/**
 * Runs the limiter, allowing the request if the limiter itself is unavailable.
 *
 * The original code only failed open when Upstash was *unconfigured*. When the env
 * vars were set but the host had gone away, `limit()` threw and the error escaped
 * the calling route as a 500 — which took down every route behind the limiter,
 * including PayPal order creation, Stripe checkout and the contact form. A deleted
 * Upstash database did exactly that in production: `getaddrinfo ENOTFOUND`, and
 * customers could not pay.
 *
 * A rate limiter is a protective measure, not a correctness gate. If it cannot be
 * reached, the right failure is to let the request through and make the outage
 * loud in the logs — not to stop taking money.
 */
export async function checkLimit(limiter: Limiter | null, key: string): Promise<{ success: boolean }> {
  if (!limiter) return { success: true };

  try {
    const { success } = await limiter.limit(key);
    return { success };
  } catch (error) {
    console.error("[rate-limit] limiter unreachable — allowing request", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: true };
  }
}

/**
 * Check a rate limit. `bucket` namespaces the counter (e.g. "contact"),
 * `identifier` is usually the client IP. Returns { success } — true when the
 * request is allowed. Fails open when Upstash is unconfigured *or* unreachable.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ success: boolean }> {
  return checkLimit(getLimiter(limit, windowSeconds), `${bucket}:${identifier}`);
}
