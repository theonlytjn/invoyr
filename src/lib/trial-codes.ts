import { z } from "zod";
import { createServiceClient } from "./supabase/server";

/**
 * Early-access codes. A valid code swaps the standard trial for a longer one
 * (FOUNDING = 90 days); a card is still taken and Stripe bills when it ends.
 * Codes live in the `trial_codes` table and are managed in the Supabase
 * dashboard: add a row to create one, set `active` to false to switch it off.
 */
export const trialCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{3,32}$/, "That code doesn't look right");

/** Days of trial a code gives, or null when it can't be used. Reserves nothing. */
export async function checkTrialCode(code: string): Promise<number | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.rpc("redeem_trial_code", { p_code: code });
  if (error) throw new Error(`Couldn't check the code: ${error.message}`);
  return typeof data === "number" ? data : null;
}

/**
 * Reserves a code for an org and returns its trial length, or null when the
 * code is invalid, expired or used up. An org that already redeemed a code
 * gets that code's length back, so retrying checkout doesn't use a second slot.
 */
export async function redeemTrialCode(orgId: string, code: string): Promise<number | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.rpc("redeem_trial_code", { p_code: code, p_org_id: orgId });
  if (error) throw new Error(`Couldn't redeem the code: ${error.message}`);
  return typeof data === "number" ? data : null;
}
