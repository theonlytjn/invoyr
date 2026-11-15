import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getResend } from "@/lib/resend/client";
import { apiError, serverError } from "@/lib/api/errors";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const bodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("message"),
    name: z.string().trim().min(1).max(100),
    email: z.string().email(),
    message: z.string().trim().min(1).max(2000),
    captchaToken: z.string().optional(),
  }),
  z.object({
    kind: z.literal("demo"),
    name: z.string().trim().min(1).max(100),
    email: z.string().email(),
    company: z.string().trim().max(120).optional().default(""),
    teamSize: z.string().trim().max(40).optional().default(""),
    availability: z.string().trim().max(300).optional().default(""),
    message: z.string().trim().max(2000).optional().default(""),
    captchaToken: z.string().optional(),
  }),
]);

/** Everything a visitor typed goes into HTML, so it is escaped first. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string): string {
  return value ? `<p><strong>${label}:</strong> ${escapeHtml(value).replace(/\n/g, "<br>")}</p>` : "";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { success } = await rateLimit("contact", ip, 5, 60);
  if (!success) return apiError("Too many requests. Please try again shortly.", 429);

  const body = await req.json().catch(() => null);
  // Older clients posted without a kind; they were all plain messages.
  const parsed = bodySchema.safeParse(
    body && typeof body === "object" && !("kind" in body) ? { ...body, kind: "message" } : body
  );

  if (!parsed.success) {
    return apiError("Invalid input", 400);
  }

  if (!(await verifyTurnstile(parsed.data.captchaToken, ip))) {
    return apiError("Captcha verification failed. Please try again.", 400);
  }

  const data = parsed.data;
  const toEmail = process.env.CONTACT_EMAIL ?? "hello@invoyr.io";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@invoyr.io";

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: data.email,
    subject:
      data.kind === "demo"
        ? `Demo request: ${data.name}${data.company ? ` (${data.company})` : ""}`
        : `Contact form: ${data.name}`,
    html:
      row("Name", data.name) +
      row("Email", data.email) +
      (data.kind === "demo"
        ? row("Company", data.company) +
          row("Team size", data.teamSize) +
          row("Times that suit", data.availability) +
          row("What to cover", data.message)
        : row("Message", data.message)),
  });

  if (error) {
    return serverError("contact: resend send", error, "Could not send your message. Please try again.");
  }

  return NextResponse.json({ ok: true });
}
