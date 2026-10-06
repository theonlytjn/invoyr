import { requireAdmin } from "@/lib/admin";
import { EMAIL_PREVIEWS, MISSING_PREVIEWS } from "@/emails/preview-gallery";

export const metadata = { title: "Admin — Emails" };

/**
 * Every customer-facing email, rendered as it will arrive.
 *
 * Each preview is an iframe of the real rendered template, so what you see is
 * what Resend sends — not an approximation maintained alongside it.
 */
export default async function AdminEmailsPage() {
  await requireAdmin();

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-neutral-950 dark:text-neutral-50">Emails</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {EMAIL_PREVIEWS.length} templates rendered with sample data, exactly as they are sent.
          Styling is shared, so a change to the layout applies to all of them.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {EMAIL_PREVIEWS.map((preview) => (
          <section
            key={preview.slug}
            className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          >
            <header className="border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {preview.title}
                </h2>
                <a
                  href={`/api/admin/email-preview/${preview.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50"
                >
                  Open ↗
                </a>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">{preview.description}</p>
            </header>
            <iframe
              src={`/api/admin/email-preview/${preview.slug}`}
              title={`${preview.title} preview`}
              className="h-[520px] w-full rounded-b-2xl bg-white"
            />
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Not previewable yet
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          These templates exist and send, but have no sample data to render from.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {MISSING_PREVIEWS.map((name) => (
            <li
              key={name}
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
