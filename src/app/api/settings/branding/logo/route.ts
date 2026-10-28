import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSettingsAccess } from "@/lib/settings/require-settings-access";

/**
 * Records (or clears) the logo URL after the browser has uploaded the file to
 * the `logos` bucket. The upload itself stays client-side; the storage
 * policies already scope it to the uploader's org. Only this column write
 * moved here, because `orgs_update` is owner-only and an admin's change was
 * silently dropped.
 */
const schema = z.object({ logoUrl: z.string().url().max(1000).nullable() });

export async function POST(req: NextRequest) {
  const access = await requireSettingsAccess();
  if (access.response) return access.response;
  const { org } = access;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid logo" }, { status: 400 });

  // Only a file in this org's own folder of the logos bucket, so the column
  // can't be pointed at an arbitrary URL that then prints on every invoice.
  const { logoUrl } = parsed.data;
  if (logoUrl) {
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${org.id}/`;
    if (!logoUrl.startsWith(base)) {
      return NextResponse.json({ error: "Invalid logo location" }, { status: 400 });
    }
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("organisations")
    .update({ logo_url: logoUrl })
    .eq("id", org.id)
    .select("id");

  if (error || !data?.length) {
    return NextResponse.json({ error: error?.message ?? "Logo was not saved. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
