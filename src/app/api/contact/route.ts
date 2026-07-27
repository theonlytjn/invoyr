import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getResend } from "@/lib/resend/client";
import { apiError, serverError } from "@/lib/api/errors";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
  captchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { success } = await rateLimit("contact", ip, 5, 60);
  if (!success) return apiError("Too many requests. Please try again shortly.", 429);

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid input", 400);
  }

  if (!(await verifyTurnstile(parsed.data.captchaToken, ip))) {
    return apiError("Captcha verification failed. Please try again.", 400);
  }

  const { name, email, message } = parsed.data;
  const toEmail = process.env.CONTACT_EMAIL ?? "hello@invoyr.io";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@invoyr.io";

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: email,
    subject: `Contact form: ${name}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
  });

  if (error) {
    return serverError("contact: resend send", error, "Could not send your message. Please try again.");
  }

  return NextResponse.json({ ok: true });
}
