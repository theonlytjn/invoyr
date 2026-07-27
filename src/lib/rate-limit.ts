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

/**
 * Check a rate limit. `bucket` namespaces the counter (e.g. "contact"),
 * `identifier` is usually the client IP. Returns { success } — true when the
 * request is allowed. Fails open (allows) if Upstash isn't configured.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ success: boolean }> {
  const limiter = getLimiter(limit, windowSeconds);
  if (!limiter) return { success: true };
  const { success } = await limiter.limit(`${bucket}:${identifier}`);
  return { success };
}
