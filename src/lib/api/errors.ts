import { NextResponse } from "next/server";

// Return a generic error to the client while logging the full detail
// server-side. Prevents leaking Postgres/provider internals (column names,
// constraint text, RLS messages) to callers — especially on public routes.
//
// Usage:
//   if (error) return serverError("contact: resend send", error);
//   return apiError("Invalid input", 400);

export function apiError(publicMessage: string, status: number) {
  return NextResponse.json({ error: publicMessage }, { status });
}

export function serverError(
  logContext: string,
  detail: unknown,
  publicMessage = "Something went wrong. Please try again.",
) {
  // Full detail stays in the server logs only.
  console.error(`[api] ${logContext}:`, detail);
  return NextResponse.json({ error: publicMessage }, { status: 500 });
}
