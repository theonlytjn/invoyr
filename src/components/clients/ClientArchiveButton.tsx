"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Props {
  clientId: string;
  archived: boolean;
}

export default function ClientArchiveButton({ clientId, archived }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const label = archived ? "unarchive" : "archive";
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} this client?`)) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("clients").update({ archived: !archived }).eq("id", clientId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={archived ? "text-neutral-600" : "text-amber-600 border-amber-200 hover:bg-amber-50"}
    >
      {loading ? "…" : archived ? "Unarchive" : "Archive"}
    </Button>
  );
}
