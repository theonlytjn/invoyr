import { createHmac, randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { WebhookEventType } from "@/lib/supabase/types";

export async function dispatchWebhook(
  orgId: string,
  event: WebhookEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();

  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select("id, url, secret, events")
    .eq("org_id", orgId)
    .eq("enabled", true);

  if (!endpoints?.length) return;

  const active = endpoints.filter((ep) =>
    (ep.events as string[]).includes(event)
  );
  if (!active.length) return;

  const body = JSON.stringify({ event, data: payload, created_at: new Date().toISOString() });
  const timestamp = Math.floor(Date.now() / 1000).toString();

  await Promise.allSettled(
    active.map(async (ep) => {
      const sig = createHmac("sha256", ep.secret)
        .update(`${timestamp}.${body}`)
        .digest("hex");

      let statusCode: number | null = null;
      let success = false;
      let error: string | null = null;

      try {
        const res = await fetch(ep.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Invoyr-Signature": `t=${timestamp},v1=${sig}`,
            "User-Agent": "Invoyr-Webhooks/1.0",
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        statusCode = res.status;
        success = res.ok;
        if (!res.ok) error = `HTTP ${res.status}`;
      } catch (err) {
        error = err instanceof Error ? err.message : "Request failed";
      }

      await supabase.from("webhook_deliveries").insert({
        endpoint_id: ep.id,
        org_id: orgId,
        event,
        status_code: statusCode,
        success,
        error,
      });

      if (success) {
        await supabase
          .from("webhook_endpoints")
          .update({ last_triggered_at: new Date().toISOString(), failure_count: 0 })
          .eq("id", ep.id);
      } else {
        // Fetch current failure count and increment
        const { data: current } = await supabase
          .from("webhook_endpoints")
          .select("failure_count")
          .eq("id", ep.id)
          .single();
        await supabase
          .from("webhook_endpoints")
          .update({ failure_count: (current?.failure_count ?? 0) + 1 })
          .eq("id", ep.id);
      }
    })
  );
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}
