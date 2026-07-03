import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, getAccounts } from "@/lib/truelayer/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/expenses?bank_error=cancelled`);
  }

  // Verify state matches what we set
  const cookieStore = await cookies();
  const storedState = cookieStore.get("tl_state")?.value;
  if (storedState !== state) {
    return NextResponse.redirect(`${appUrl}/expenses?bank_error=invalid_state`);
  }
  cookieStore.delete("tl_state");

  let orgId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    orgId = decoded.orgId;
  } catch {
    return NextResponse.redirect(`${appUrl}/expenses?bank_error=invalid_state`);
  }

  try {
    const tokens = await exchangeCode(code);
    const accounts = await getAccounts(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const supabase = await createClient();

    for (const account of accounts) {
      await supabase.from("bank_connections").upsert(
        {
          org_id: orgId,
          provider: "truelayer",
          account_id: account.account_id,
          account_name: account.display_name,
          account_type: account.account_type,
          currency: account.currency,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
        },
        { onConflict: "org_id,account_id" },
      );
    }

    return NextResponse.redirect(`${appUrl}/expenses?bank_connected=1`);
  } catch (err) {
    console.error("Bank callback error:", err);
    return NextResponse.redirect(`${appUrl}/expenses?bank_error=connect_failed`);
  }
}
