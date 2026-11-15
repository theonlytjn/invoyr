import { createElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { FounderNoteEmail } from "@/emails/transactional/FounderNoteEmail";
import { FOUNDER_NOTE_COPY, type FounderNoteKind } from "@/config/email-copy";
import { BRAND } from "@/config/brand";

export const FOUNDER_NOTE_TEMPLATES = {
  signup: "signup-follow-up",
  trialEnded: "trial-ended-follow-up",
} as const satisfies Record<FounderNoteKind, string>;

/** "Tony from Invoyr <invoices@invoyr.io>", whatever form the env var takes. */
export function founderFrom(): string | undefined {
  const configured = process.env.RESEND_FROM_EMAIL;
  if (!configured) return undefined;
  const address = configured.match(/<([^>]+)>/)?.[1] ?? configured.trim();
  return `${FOUNDER_NOTE_COPY.signerName.split(" ")[0]} from ${BRAND.name} <${address}>`;
}

export function founderNoteCtaUrl(note: FounderNoteKind): string {
  return note === "trialEnded" ? `${BRAND.roadmapUrl}?suggest=1` : BRAND.roadmapUrl;
}

interface SendFounderNoteOptions {
  note: FounderNoteKind;
  to: string;
  firstName?: string | null;
  orgId: string | null;
  userId: string | null;
}

/**
 * Sends one founder note, at most once per address per kind, ever. The guard
 * reads email_logs and fails safe: if the lookup errors, nothing is sent and
 * the next run tries again.
 */
export async function sendFounderNote(
  supabase: SupabaseClient,
  { note, to, firstName, orgId, userId }: SendFounderNoteOptions
): Promise<boolean> {
  const templateName = FOUNDER_NOTE_TEMPLATES[note];
  const { data: prior, error } = await supabase
    .from("email_logs")
    .select("id")
    .eq("template_name", templateName)
    .eq("to_email", to)
    .limit(1);
  if (error || prior?.length) return false;

  const result = await sendTransactionalEmail({
    orgId,
    userId,
    to,
    subject: FOUNDER_NOTE_COPY[note].subject,
    templateName,
    fromEmail: founderFrom(),
    replyTo: BRAND.supportEmail,
    skipOrgSmtp: true,
    react: createElement(FounderNoteEmail, {
      note,
      firstName: firstName?.trim() || null,
      ctaUrl: founderNoteCtaUrl(note),
    }),
  });
  return result.ok;
}
