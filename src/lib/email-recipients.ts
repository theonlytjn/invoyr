/** Basic shape check — deliverability is the sender's problem, not ours. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_CC_RECIPIENTS = 5;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * Parses the comma/semicolon/newline separated list people actually type into a
 * CC field, de-duplicating case-insensitively and preserving order.
 */
export function parseRecipientList(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of input.split(/[,;\n]/)) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }

  return out;
}

/** The first problem with a CC list, or null when it's usable. */
export function validateRecipientList(emails: string[]): string | null {
  const invalid = emails.find((email) => !isValidEmail(email));
  if (invalid) return `"${invalid}" is not a valid email address.`;
  if (emails.length > MAX_CC_RECIPIENTS) {
    return `Add at most ${MAX_CC_RECIPIENTS} additional recipients.`;
  }
  return null;
}

/**
 * The CC list to actually send to: valid addresses only, with the primary
 * recipient removed so nobody is both To and CC on the same email.
 */
export function ccRecipients(
  primary: string | null | undefined,
  cc: string[] | null | undefined
): string[] {
  if (!cc?.length) return [];
  const primaryKey = primary?.trim().toLowerCase();

  return cc
    .map((email) => email.trim())
    .filter((email) => isValidEmail(email) && email.toLowerCase() !== primaryKey)
    .filter((email, index, list) => list.findIndex((e) => e.toLowerCase() === email.toLowerCase()) === index);
}
