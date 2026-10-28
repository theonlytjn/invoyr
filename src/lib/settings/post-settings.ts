/**
 * Posts a settings form to its same-origin route and returns an error message
 * to show, or null on success. Settings writes go through our own routes rather
 * than straight to Supabase: see src/app/api/settings/email/route.ts.
 */
export async function postSettings(url: string, body: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res) return "We couldn't reach the server. Check your connection and try again.";

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    return payload?.error ?? "Settings were not saved. Please try again.";
  }

  return null;
}
