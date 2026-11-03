import { z } from "zod";

/**
 * What a visitor picked before signing up: the plan and billing period from a
 * pricing card, and an early-access code from /signup?code=…. Signup stores it
 * in a cookie so it survives the email-confirmation round trip and the Google
 * redirect, and onboarding starts from it. Opening the confirmation link in a
 * different browser loses it, which is why the code can also be typed in.
 */
export const SIGNUP_INTENT_COOKIE = "invoyr_signup_intent";

export const signupIntentSchema = z.object({
  plan: z.enum(["starter", "business", "pro"]).optional().catch(undefined),
  billing: z.enum(["monthly", "yearly"]).optional().catch(undefined),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,32}$/)
    .optional()
    .catch(undefined),
});

export type SignupIntent = z.infer<typeof signupIntentSchema>;

export function parseSignupIntent(raw: string | null | undefined): SignupIntent {
  if (!raw) return {};
  try {
    const parsed = signupIntentSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/** Reads ?plan, ?billing and ?code from a query string, keeping only valid values. */
export function signupIntentFromSearch(search: string): SignupIntent {
  const params = new URLSearchParams(search);
  const parsed = signupIntentSchema.safeParse({
    plan: params.get("plan") ?? undefined,
    billing: params.get("billing") ?? undefined,
    code: params.get("code") ?? undefined,
  });
  return parsed.success ? parsed.data : {};
}
