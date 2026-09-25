export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const LOGO_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** Human-readable reason the file can't be used, or null when it's fine. */
export function validateLogoFile(file: { type: string; size: number }): string | null {
  if (!(LOGO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return "Choose a PNG, JPG, WEBP or SVG image.";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return "That image is over 2MB. Choose a smaller file.";
  }
  return null;
}

/**
 * Logos live under the org id because the storage policies match the first path
 * segment against org_members. A fixed filename per type keeps one logo per org
 * rather than accumulating a file per upload.
 */
export function logoStoragePath(orgId: string, contentType: string): string {
  return `${orgId}/logo.${EXTENSIONS[contentType] ?? "png"}`;
}
