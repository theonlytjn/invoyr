import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { getAdminUser } from "@/lib/admin";
import { EMAIL_PREVIEWS } from "@/emails/preview-gallery";

/** Renders one email to HTML for the admin preview gallery's iframe. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const preview = EMAIL_PREVIEWS.find((p) => p.slug === slug);
  if (!preview) return NextResponse.json({ error: "Unknown template" }, { status: 404 });

  const html = await render(preview.element());

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
