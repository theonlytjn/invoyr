"use client";

import { useSignOut } from "@/hooks/useSignOut";

interface Props {
  email: string;
  /** Named so it is obvious which account is about to be left, when several are in play. */
  orgName?: string | null;
}

export default function SignOutPanel({ email, orgName }: Props) {
  const { signOut, signingOut } = useSignOut();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        Signed in as <span className="font-medium text-neutral-950 dark:text-neutral-50">{email}</span>
        {orgName ? (
          <>
            {" "}
            on <span className="font-medium text-neutral-950 dark:text-neutral-50">{orgName}</span>
          </>
        ) : null}
        .
      </p>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
