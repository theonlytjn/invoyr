import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const item = z.object({
  description: z.string().trim().min(1, "Every line needs a description."),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  vat_rate: z.number().min(0).max(100),
  sort_order: z.number().int().default(0),
});

const fields = {
  client_id: z.string().uuid().nullable().optional(),
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  start_date: date,
  end_date: date.nullable().optional(),
  template: z.enum(["tjn_classic", "clean_minimal", "bold_split", "modern_studio"]),
  currency: z.string().length(3),
  notes: z.string().max(5000).nullable().optional(),
  terms: z.string().max(5000).nullable().optional(),
  auto_send: z.boolean(),
  due_days: z.number().int().min(0).max(365),
  items: z.array(item).min(1, "Add at least one line."),
};

type Shape = { client_id?: string | null; auto_send?: boolean; start_date?: string; end_date?: string | null };

/** Rules that span fields, shared by create and edit. The problem, or null. */
export function checkSchedule(value: Shape): string | null {
  if (value.auto_send && !value.client_id) return "Choose a client to auto-send to.";
  if (value.end_date && value.start_date && value.end_date < value.start_date) {
    return "The end date is before the first invoice.";
  }
  return null;
}

export const createRecurringSchema = z
  .object({
    ...fields,
    template: fields.template.default("tjn_classic"),
    currency: fields.currency.default("GBP"),
    auto_send: fields.auto_send.default(false),
    due_days: fields.due_days.default(30),
  })
  .superRefine((value, ctx) => {
    const problem = checkSchedule(value);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  });

export const updateRecurringSchema = z
  .object(fields)
  .partial()
  .extend({ status: z.enum(["active", "paused", "ended"]).optional() });


/** The first readable message from a failed parse. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the schedule and try again.";
}
