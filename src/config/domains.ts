/**
 * The marketing site (invoyr.io) and the app (app.invoyr.io) are separate
 * origins. They are the same *site*, though, so the app's SameSite=Lax session
 * cookie still travels on requests from marketing pages to the app domain —
 * which is what lets the marketing header know who is signed in.
 */
export const APP_ORIGIN = "https://app.invoyr.io";

export const MARKETING_ORIGINS = ["https://invoyr.io", "https://www.invoyr.io"];

/** Where marketing pages should send app requests. Same-origin off production (localhost, previews). */
export function appOriginFor(hostname: string): string {
  return MARKETING_ORIGINS.some((o) => new URL(o).hostname === hostname) ? APP_ORIGIN : "";
}
