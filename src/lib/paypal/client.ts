export const PAYPAL_LIVE_API = "https://api-m.paypal.com";
export const PAYPAL_SANDBOX_API = "https://api-m.sandbox.paypal.com";

// Exact hosts only — no substring matching, or "api-m.sandbox.paypal.com" would
// match a "paypal.com" rule and quietly send sandbox traffic to the live API.
const LIVE_HOSTS = new Set(["api-m.paypal.com", "www.paypal.com", "paypal.com"]);
const SANDBOX_HOSTS = new Set([
  "api-m.sandbox.paypal.com",
  "www.sandbox.paypal.com",
  "sandbox.paypal.com",
]);

/**
 * Chooses the API host from PAYPAL_ENV.
 *
 * A name like PAYPAL_ENV invites three different answers, and this variable has now
 * been wrong in production in two of them:
 *
 *   - an environment word — but PayPal's dashboard says "Sandbox" and "Live" and
 *     never "production", so "live" is at least as natural to write
 *   - the API hostname, which is what it actually held: "api-m.paypal.com"
 *
 * The original strict `=== "production"` treated everything except one exact word as
 * sandbox, silently. Live credentials sent to the sandbox host come back as
 * `invalid_client` — identical to the error for a genuinely wrong secret — so the
 * misconfiguration was indistinguishable from a credentials fault. That is what made
 * it expensive: the failure pointed at the wrong thing.
 *
 * Each accepted value states the intended environment unambiguously; a PayPal API
 * hostname has no second reading. Anything unrecognised falls back to sandbox, so a
 * typo can never move real money.
 */
export function resolvePayPalBaseUrl(value: string | undefined): string {
  const raw = value
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  if (!raw) return PAYPAL_SANDBOX_API;
  if (raw === "production" || raw === "live") return PAYPAL_LIVE_API;
  if (SANDBOX_HOSTS.has(raw)) return PAYPAL_SANDBOX_API;
  if (LIVE_HOSTS.has(raw)) return PAYPAL_LIVE_API;
  return PAYPAL_SANDBOX_API;
}

const BASE_URL = resolvePayPalBaseUrl(process.env.PAYPAL_ENV);

/**
 * Explains an OAuth rejection using PayPal's own response.
 *
 * The original code threw a bare "PayPal auth failed", discarding the body — which is
 * the only part that says *why*. That turned a one-line misconfiguration into a blind
 * hunt: the logs could not distinguish rejected credentials from a mismatched
 * environment, and the two have completely different fixes.
 *
 * The secret is never included — only whether it is set. The client ID is public (it
 * ships to the browser in the SDK URL), but only its leading characters are logged,
 * which is enough to tell two credential pairs apart at a glance.
 */
export function describeAuthFailure(
  status: number,
  data: unknown,
  env: { baseUrl: string; clientId?: string; hasSecret: boolean; paypalEnv?: string }
): string {
  const body = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const reason = [body.error, body.error_description]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(": ");

  // invalid_client is overwhelmingly the cause, and its two triggers look identical
  // from the outside, so name both rather than leaving the reader to guess.
  const hint =
    body.error === "invalid_client"
      ? " — PayPal rejected the credentials. The ID and secret must be a matching pair from the SAME app, and from the same environment as the endpoint below."
      : "";

  const clientId = env.clientId
    ? `${env.clientId.slice(0, 8)}…(${env.clientId.length} chars)`
    : "MISSING";

  // The endpoint alone says which host was used but not why. Quoting the raw
  // PAYPAL_ENV distinguishes "never set on this environment" from "set to a value
  // that doesn't mean live" — different fixes, and guessing between them cost a
  // deploy cycle. The value is a environment name, never a credential.
  const declaredEnv =
    env.paypalEnv === undefined ? "UNSET" : JSON.stringify(env.paypalEnv);

  return (
    `PayPal auth failed (HTTP ${status})${reason ? `: ${reason}` : ""}${hint}` +
    ` [endpoint=${env.baseUrl} PAYPAL_ENV=${declaredEnv}` +
    ` clientId=${clientId} secret=${env.hasSecret ? "set" : "MISSING"}]`
  );
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!data || typeof data.access_token !== "string") {
    throw new Error(
      describeAuthFailure(res.status, data, {
        baseUrl: BASE_URL,
        clientId,
        hasSecret: !!clientSecret,
        paypalEnv: process.env.PAYPAL_ENV,
      })
    );
  }
  return data.access_token;
}

export async function createPayPalOrder({
  invoiceId,
  amount,
  currency,
  payeeEmail,
  invoiceNumber,
}: {
  invoiceId: string;
  amount: number;
  currency: string;
  payeeEmail: string;
  invoiceNumber: string;
}) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${invoiceId}-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: invoiceId,
          description: `Invoice ${invoiceNumber}`,
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2),
          },
          payee: {
            email_address: payeeEmail,
          },
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });

  return res.json() as Promise<{ id: string; status: string }>;
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.json() as Promise<{
    id: string;
    status: string;
    purchase_units: Array<{
      custom_id: string;
      payments: {
        captures: Array<{
          id: string;
          amount: { value: string; currency_code: string };
        }>;
      };
    }>;
  }>;
}

export async function verifyPayPalWebhook({
  transmissionId,
  transmissionTime,
  certUrl,
  authAlgo,
  transmissionSig,
  body,
}: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  body: string;
}) {
  const token = await getAccessToken();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const res = await fetch(`${BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
