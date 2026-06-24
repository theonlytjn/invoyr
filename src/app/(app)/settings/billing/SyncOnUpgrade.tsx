"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function SyncOnUpgrade() {
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    fetch("/api/billing/sync", { method: "POST" }).then(() => {
      router.refresh();
    });
  }, [router]);

  return null;
}
