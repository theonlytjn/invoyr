"use client";

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="w-full py-2.5 px-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
    >
      Try again
    </button>
  );
}
