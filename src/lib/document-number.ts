import type { SupabaseClient } from "@supabase/supabase-js";

// No server-only imports: the invoice form claims its number from the browser.
export type DocumentKind = "invoice" | "estimate" | "credit_note";

export function formatDocumentNumber(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

/**
 * Claims the next number for an org in one atomic step (the
 * `claim_document_number` Postgres function). It used to be a read followed by
 * a separate, unchecked `next_*_number + 1` write: two saves at once got the
 * same number, and RLS silently dropped the write for anyone but the owner, so
 * an admin's next invoice reused the number too.
 *
 * Throws rather than returning a guess, so a caller never saves a document
 * with a number that wasn't actually reserved.
 */
export async function claimDocumentNumber(
  supabase: SupabaseClient,
  orgId: string,
  kind: DocumentKind
): Promise<number> {
  const { data, error } = await supabase.rpc("claim_document_number", {
    p_org_id: orgId,
    p_kind: kind,
  });

  if (error || typeof data !== "number") {
    throw new Error(`Couldn't reserve the next ${kind.replace("_", " ")} number: ${error?.message ?? "no number returned"}`);
  }

  return data;
}
