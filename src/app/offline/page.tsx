import type { Metadata } from "next";
import { ReloadButton } from "./ReloadButton";

export const metadata: Metadata = { title: "You're offline" };

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 px-6">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
          <span className="hgi hgi-stroke hgi-rounded hgi-wifi-disconnected-01 text-2xl text-neutral-500 dark:text-neutral-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            You&apos;re offline
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Check your internet connection and try again. Your work is saved and will sync when
            you&apos;re back online.
          </p>
        </div>

        <ReloadButton />
      </div>
    </div>
  );
}
