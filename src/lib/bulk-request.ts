import { z } from "zod";
import { MAX_BULK_IDS } from "./bulk-actions";

/**
 * The `ids` field every bulk route validates.
 *
 * Kept in one place for two reasons:
 *
 * 1. The cap is `MAX_BULK_IDS`, the same constant the lists use to bound their
 *    "select all", so the client can never build a request the server rejects.
 * 2. The ids are deduped. `summarise` derives its "could not be found" count
 *    from `requestedIds.length`, so a repeated id would otherwise be reported
 *    as a missing record — and, in routes that write, acted on twice.
 *
 * Note the order: `.max()` runs before the transform, so 60 ids that dedupe to
 * 40 are still rejected. That is deliberate — the cap bounds the work a caller
 * can ask for, not the work that survives deduplication.
 */
export function bulkIdsSchema(max: number = MAX_BULK_IDS) {
  return z
    .array(z.string().uuid())
    .min(1)
    .max(max)
    .transform((ids) => Array.from(new Set(ids)));
}
