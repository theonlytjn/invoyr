/**
 * Lives in its own module with no imports so the edge middleware can use it.
 * `lib/auth` pulls in `next/headers` and the Supabase server client, which must
 * not end up in the middleware bundle.
 */
export const ACTIVE_ORG_COOKIE = "active_org_id";
