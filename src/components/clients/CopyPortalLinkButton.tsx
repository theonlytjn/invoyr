"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/icons";

interface Props {
  portalToken: string;
}

export default function CopyPortalLinkButton({ portalToken }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
    await navigator.clipboard.writeText(`${appUrl}/client/${portalToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3.5 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      {copied ? (
        <>
          <CheckIcon size={14} className="text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <CopyIcon size={14} />
          Share portal
        </>
      )}
    </button>
  );
}
