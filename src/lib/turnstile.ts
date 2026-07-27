// Server-side Cloudflare Turnstile verification (for our own API routes, e.g.
// the contact form). Supabase Auth verifies Turnstile itself for signup/login
// when CAPTCHA is enabled in the Supabase dashboard, so those pass the token
// through options.captchaToken instead of calling this.
//
// Fails open when TURNSTILE_SECRET_KEY isn't configured, so the app keeps
// working before the keys are added; set it in prod to enforce.
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured yet — don't block
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[api] turnstile verify failed:", err);
    return false;
  }
}
