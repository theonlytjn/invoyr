import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth";
import { buildOrgRow, orgCreateSchema } from "@/lib/onboarding/org-input";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = orgCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // `organisations` has no authenticated INSERT policy by design, so the row is
  // written with the service client. Onboarding used to insert it straight from
  // the browser, which RLS silently refused.
  const service = createServiceClient();
  const orgId = crypto.randomUUID();

  const { data: org, error: orgErr } = await service
    .from("organisations")
    .insert(buildOrgRow(parsed.data, orgId))
    .select()
    .single();

  if (orgErr || !org) {
    return NextResponse.json({ error: orgErr?.message ?? "Failed to create organisation" }, { status: 500 });
  }

  const { error: memberErr } = await service
    .from("org_members")
    .insert({ org_id: org.id, user_id: user.id, role: "owner" });

  if (memberErr) {
    // An org nobody belongs to is invisible to every RLS policy and could never
    // be reached again, so it is removed rather than left behind.
    await service.from("organisations").delete().eq("id", org.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, org.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true, org });
}
