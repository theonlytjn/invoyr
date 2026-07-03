import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bank_connections")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
