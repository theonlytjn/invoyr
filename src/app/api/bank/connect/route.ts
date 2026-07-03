import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/truelayer/client";
import { cookies } from "next/headers";

export async function GET() {
  const org = await requireOrg();

  // Encode orgId + random nonce in state for CSRF protection
  const nonce = crypto.randomUUID();
  const state = Buffer.from(JSON.stringify({ orgId: org.id, nonce })).toString("base64url");

  // Store nonce in a short-lived cookie to verify on callback
  const cookieStore = await cookies();
  cookieStore.set("tl_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return NextResponse.redirect(buildAuthUrl(state));
}
