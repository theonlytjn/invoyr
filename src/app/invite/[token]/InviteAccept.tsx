"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  token: string;
  inviteEmail: string;
  orgName: string;
  expired: boolean;
  userEmail: string | null;
  userId: string | null;
}

export default function InviteAccept({ token, inviteEmail, orgName, expired, userEmail, userId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (expired) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 rounded-lg px-4 py-3">
          This invite has expired. Ask the team owner to send a new invite.
        </div>
      </div>
    );
  }

  if (!userId) {
    const loginUrl = `/login?redirect=/invite/${token}`;
    const signupUrl = `/signup?redirect=/invite/${token}`;
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          Sign in or create an account with <strong>{inviteEmail}</strong> to accept this invite.
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href={loginUrl}>Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={signupUrl}>Create account</Link>
          </Button>
        </div>
      </div>
    );
  }

  const emailMismatch = userEmail?.toLowerCase() !== inviteEmail.toLowerCase();

  if (emailMismatch) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30 rounded-lg px-4 py-3">
          You're signed in as <strong>{userEmail}</strong>, but this invite was sent to <strong>{inviteEmail}</strong>.
          Please sign in with the correct account.
        </div>
        <Button variant="outline" asChild>
          <Link href={`/login?redirect=/invite/${token}`}>Switch account</Link>
        </Button>
      </div>
    );
  }

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/team/accept/${token}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Signed in as <strong>{userEmail}</strong>.
      </p>
      <Button onClick={handleAccept} disabled={isPending} className="w-full">
        {isPending ? "Joining…" : `Join ${orgName}`}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
