import { getAdminUser } from "@/lib/admin";

/**
 * Open Banking is built but the provider (TrueLayer) has not approved Invoyr
 * for production, so customers get a "coming soon" preview instead. Set
 * OPEN_BANKING_LIVE=true in Vercel to switch it on for everyone. The admin
 * keeps real access so the integration can still be tested.
 */
export async function isOpenBankingAvailable(): Promise<boolean> {
  if (process.env.OPEN_BANKING_LIVE === "true") return true;
  return (await getAdminUser()) !== null;
}
