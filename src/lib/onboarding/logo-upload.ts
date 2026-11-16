export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Raster formats only. SVG is refused everywhere (here, Settings, and the
 * `logos` bucket's allowed types): Gmail and Outlook don't display SVG images,
 * the PDF renderer can't embed them, and an SVG can carry script.
 */
export const LOGO_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Shown under every logo picker. */
export const LOGO_HINT = "PNG, JPG or WebP, up to 2MB.";

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Human-readable reason the file can't be used, or null when it's fine. */
export function validateLogoFile(file: { type: string; size: number }): string | null {
  if (!(LOGO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return "Choose a PNG, JPG or WebP image.";
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

/**
 * The file's real format from its first bytes, or null when it isn't one we
 * accept. The browser's `type` comes from the file name, so an SVG renamed
 * logo.png would otherwise pass.
 */
export function sniffLogoType(bytes: Uint8Array): (typeof LOGO_ACCEPTED_TYPES)[number] | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
