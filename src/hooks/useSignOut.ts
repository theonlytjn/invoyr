"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Signing out, shared by every surface that offers it.
 *
 * It lived inline in the desktop sidebar, which is `hidden lg:flex` — so on a phone
 * there was no way to sign out at all, and no second copy to fix because there was no
 * second surface. Extracting it means a new surface costs nothing and cannot drift
 * from this one.
 *
 * `router.refresh()` follows the push because the app shell is server-rendered and
 * holds the signed-in user; without it the next page can paint with the previous
 * account's details still in place.
 */
export function useSignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await createClient().auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      // Re-enable the control rather than stranding someone on a dead button.
      console.error("[auth] sign out failed", error);
      setSigningOut(false);
    }
  }

  return { signOut, signingOut };
}
