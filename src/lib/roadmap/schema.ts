import { z } from "zod";

export const importanceSchema = z.enum(["not_important", "nice_to_have", "important", "critical"]);
export const statusSchema = z.enum(["considering", "planned", "in_progress", "launched"]);
export const ideaStatusSchema = z.enum(["new", "reviewed", "merged", "published", "declined"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

/** A signed-in user's vote on one item. Sending importance null removes the vote. */
export const voteSchema = z.object({
  itemId: z.string().uuid(),
  importance: importanceSchema.nullable(),
  comment: optionalText(1000),
});

export const ideaSchema = z.object({
  title: z.string().trim().min(3, "Give your idea a short title").max(120),
  details: z.string().trim().max(2000).default(""),
});

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const itemSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only")
    .optional(),
  summary: z.string().trim().max(300).default(""),
  body: z.string().trim().max(5000).default(""),
  category: z.string().trim().min(1).max(40).default("General"),
  status: statusSchema.default("considering"),
  is_published: z.boolean().default(false),
  sort_order: z.number().int().min(-1000).max(1000).default(0),
  launched_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export const itemUpdateSchema = itemSchema.partial();

export const ideaUpdateSchema = z.object({
  status: ideaStatusSchema.optional(),
  item_id: z.string().uuid().nullable().optional(),
  admin_note: optionalText(1000),
});
