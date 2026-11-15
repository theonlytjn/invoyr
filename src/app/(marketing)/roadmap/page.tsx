import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { ROADMAP_COPY as COPY } from "@/config/roadmap";
import { PUBLIC_ITEM_COLUMNS, type PublicRoadmapItem } from "@/lib/roadmap/types";
import { RoadmapBoard } from "@/components/roadmap/RoadmapBoard";

export const metadata: Metadata = {
  title: `${COPY.metaTitle} — Invoyr`,
  description: COPY.metaDescription,
  alternates: { canonical: "https://invoyr.io/roadmap" },
};

// Static, refreshed at most every five minutes and immediately after an admin
// edit (revalidatePath in the admin routes). Votes are fetched in the browser.
export const revalidate = 300;

async function getItems(): Promise<PublicRoadmapItem[]> {
  const { data, error } = await createServiceClient()
    .from("roadmap_items")
    .select(PUBLIC_ITEM_COLUMNS)
    .eq("is_published", true);
  if (error) {
    // A missing table or outage shows an empty roadmap rather than a 500.
    console.error("roadmap: load items", error.message);
    return [];
  }
  return (data ?? []) as PublicRoadmapItem[];
}

export default async function RoadmapPage() {
  const items = await getItems();

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-20 lg:px-12 lg:py-28">
      <div className="max-w-3xl">
        <p className="font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-white">
          {COPY.kicker}
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
          {COPY.heading}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-xl">{COPY.intro}</p>
      </div>
      <div className="mt-14">
        <RoadmapBoard items={items} />
      </div>
    </div>
  );
}
