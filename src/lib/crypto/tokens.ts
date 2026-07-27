import crypto from "crypto";

// Encrypts sensitive tokens (e.g. Open Banking access/refresh tokens) at rest
// with AES-256-GCM. The key comes from TOKEN_ENCRYPTION_KEY (base64, 32 bytes).
//
// Self-describing + backward-compatible: encrypted values carry an "enc:v1:"
// prefix. Without a key, encryptToken() returns the value unchanged (so dev /
// pre-keying doesn't break), and decryptToken() passes through any value that
// isn't prefixed. Generate a key with: openssl rand -base64 32

const PREFIX = "enc:v1:";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext; // not configured — store as-is
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptToken(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // plaintext / legacy value
  const key = getKey();
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is not set but a value is encrypted");
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = raw.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
