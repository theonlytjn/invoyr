// Map raw Supabase auth errors to safe, generic user-facing messages.
// Two goals: never surface provider/DB internals, and never leak whether an
// email is registered (user enumeration) — e.g. on signup or password reset.
export function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "That email or password is incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email first — check your inbox for the link.";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security purposes")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  // Do NOT confirm the account exists — keep it non-committal.
  if (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("already been registered") ||
    m.includes("user already")
  ) {
    return "We couldn't complete sign-up with those details. Try signing in instead.";
  }
  if (m.includes("password")) {
    return "Please choose a stronger password (at least 8 characters).";
  }
  if (m.includes("email") && m.includes("invalid")) {
    return "Please enter a valid email address.";
  }
  return "Something went wrong. Please try again.";
}
