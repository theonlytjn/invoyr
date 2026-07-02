import { createHash } from "crypto";
import { createServiceClient } from "./supabase/server";

export async function validateApiKey(authHeader: string | null): Promise<{ orgId: string } | null> {
  if (!authHeader?.startsWith("Bearer inv_")) return null;
  const token = authHeader.slice(7); // strip "Bearer "

  const hash = createHash("sha256").update(token).digest("hex");
  const supabase = createServiceClient();

  const { data: key } = await supabase
    .from("api_keys")
    .select("id, org_id, revoked_at, expires_at")
    .eq("key_hash", hash)
    .single();

  if (!key || key.revoked_at) return null;
  if (key.expires_at && new Date(key.expires_at) < new Date()) return null;

  // Update last_used_at without awaiting to keep auth fast
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id)
    .then(() => {});

  return { orgId: key.org_id };
}
