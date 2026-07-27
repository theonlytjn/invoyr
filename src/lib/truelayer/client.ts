import type { BankConnection } from "@/lib/supabase/types";

const BASE_AUTH =
  process.env.TRUELAYER_ENV === "live"
    ? "https://auth.truelayer.com"
    : "https://auth.truelayer-sandbox.com";

const BASE_DATA =
  process.env.TRUELAYER_ENV === "live"
    ? "https://api.truelayer.com"
    : "https://api.truelayer-sandbox.com";

// Live shows the real UK banks; sandbox has none of those, so it also needs
// the fictitious Mock Bank (uk-cs-mock) or the auth dialog has nothing to
// select. See https://docs.truelayer.com/docs/quickstart-retrieve-bank-data
const PROVIDERS =
  process.env.TRUELAYER_ENV === "live"
    ? "uk-ob-all uk-oauth-all"
    : "uk-cs-mock uk-ob-all uk-oauth-all";

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TRUELAYER_CLIENT_ID!,
    scope: "info accounts balance transactions offline_access",
    redirect_uri: process.env.TRUELAYER_REDIRECT_URI!,
    providers: PROVIDERS,
    state,
  });
  return `${BASE_AUTH}/?${params}`;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE_AUTH}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.TRUELAYER_CLIENT_ID!,
      client_secret: process.env.TRUELAYER_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.TRUELAYER_REDIRECT_URI!,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshToken(connection: BankConnection): Promise<TokenResponse> {
  const res = await fetch(`${BASE_AUTH}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.TRUELAYER_CLIENT_ID!,
      client_secret: process.env.TRUELAYER_CLIENT_SECRET!,
      refresh_token: connection.refresh_token,
      redirect_uri: process.env.TRUELAYER_REDIRECT_URI!,
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  return res.json();
}

export async function getAccounts(accessToken: string): Promise<TLAccount[]> {
  const res = await fetch(`${BASE_DATA}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch accounts");
  const body = await res.json();
  return body.results ?? [];
}

export async function getTransactions(
  accessToken: string,
  accountId: string,
  from: string,
  to: string,
): Promise<TLTransaction[]> {
  const params = new URLSearchParams({ from, to });
  const res = await fetch(
    `${BASE_DATA}/data/v1/accounts/${accountId}/transactions?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error("Failed to fetch transactions");
  const body = await res.json();
  return body.results ?? [];
}

// Returns a valid access token, refreshing first if it expires within 60 seconds
export async function getValidToken(
  connection: BankConnection,
  onRefreshed: (tokens: TokenResponse) => Promise<void>,
): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at).getTime();
  const needsRefresh = expiresAt - Date.now() < 60_000;
  if (!needsRefresh) return connection.access_token;
  const tokens = await refreshToken(connection);
  await onRefreshed(tokens);
  return tokens.access_token;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface TLAccount {
  account_id: string;
  display_name: string;
  account_type: string;
  currency: string;
}

export interface TLTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  transaction_type: string;
  transaction_category: string;
  amount: number;
  currency: string;
  merchant_name?: string;
}
