import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed — Invoyr",
};

const MESSAGES = {
  success: {
    heading: "You've been unsubscribed",
    body: "You won't receive any more marketing emails from Invoyr. Transactional emails (invoices, payment receipts) will still be delivered.",
  },
  already: {
    heading: "Already unsubscribed",
    body: "This email address is already unsubscribed from Invoyr marketing emails.",
  },
  not_found: {
    heading: "Link not found",
    body: "This unsubscribe link is invalid or has expired. If you need help, contact support.",
  },
} as const;

type Status = keyof typeof MESSAGES;

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const key = (status as Status) in MESSAGES ? (status as Status) : "success";
  const { heading, body } = MESSAGES[key];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">{heading}</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
        <a
          href="/"
          className="inline-block mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to Invoyr
        </a>
      </div>
    </div>
  );
}
