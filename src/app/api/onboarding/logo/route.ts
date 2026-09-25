import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logoStoragePath, validateLogoFile } from "@/lib/onboarding/logo-upload";

const fieldsSchema = z.object({
  orgId: z.string().uuid(),
});

/**
 * Onboarding uploads the logo here once the organisation exists. The browser
 * can't do it itself during the wizard: the `logos` storage policies match the
 * path's org id against org_members, and the membership is only written when
 * the org is created on the final step.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const parsed = fieldsSchema.safeParse({ orgId: formData?.get("orgId") });

  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const invalid = validateLogoFile(file);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("org_id", parsed.data.orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = createServiceClient();
  const path = logoStoragePath(parsed.data.orgId, file.type);

  const { error: uploadError } = await service.storage
    .from("logos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = service.storage.from("logos").getPublicUrl(path);
  const url = `${publicUrl.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await service
    .from("organisations")
    .update({ logo_url: url })
    .eq("id", parsed.data.orgId)
    .select("id")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, logoUrl: url });
}
