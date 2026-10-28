import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailLogRow = {
  org_id: string | null;
  user_id?: string | null;
  invoice_id?: string | null;
  resend_id: string | null;
  to_email: string;
  subject: string;
  template_name: string;
  status: "sent" | "failed";
};

/**
 * Writes the email_logs row, retrying once. These inserts used to be
 * unchecked, and the reminder crons read this table to avoid chasing the same
 * invoice twice, so a lost row can mean a duplicate reminder. A failure is
 * logged with the full row rather than thrown: the email has already gone (or
 * failed) by now, and that outcome must still reach the caller.
 */
export async function writeEmailLog(
  supabase: SupabaseClient,
  row: EmailLogRow
): Promise<void> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { error } = await supabase.from("email_logs").insert(row);
    if (!error) return;
    if (attempt === 2) console.error("email_logs insert failed", { row, error: error.message });
  }
}
