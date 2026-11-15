import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { demandScore, emptyTally, type ImportanceTally } from "@/lib/roadmap/group";
import type { RoadmapIdea, RoadmapImportance, RoadmapItem } from "@/lib/roadmap/types";
import { RoadmapAdmin, type AdminFeedback, type AdminIdea, type AdminItem } from "@/components/admin/roadmap/RoadmapAdmin";

export const metadata = { title: "Admin — Roadmap" };

/**
 * Manage the public roadmap and read what people said. Vote counts and
 * comments are only ever shown here, never on the public page.
 */
export default async function AdminRoadmapPage() {
  await requireAdmin();
  const supabase = createServiceClient();

  const [{ data: items, error: itemsError }, { data: votes }, { data: ideas }, { data: authUsers }] = await Promise.all([
    supabase.from("roadmap_items").select("*").order("status").order("sort_order").order("title"),
    supabase.from("roadmap_votes").select("item_id, user_id, importance, comment, updated_at"),
    supabase.from("roadmap_ideas").select("*").order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (itemsError) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl">
        <h1 className="text-2xl font-serif text-neutral-950 dark:text-neutral-50">Roadmap</h1>
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          The roadmap tables aren&apos;t available ({itemsError.message}). Apply the
          <code className="mx-1">create_product_roadmap</code> migration from supabase/schema.sql §24.
        </p>
      </div>
    );
  }

  const emailOf = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? "unknown"]));

  const tallies = new Map<string, ImportanceTally>();
  const feedback = new Map<string, AdminFeedback[]>();
  for (const v of votes ?? []) {
    const t = tallies.get(v.item_id) ?? emptyTally();
    t[v.importance as RoadmapImportance] += 1;
    tallies.set(v.item_id, t);
    const list = feedback.get(v.item_id) ?? [];
    list.push({
      email: emailOf.get(v.user_id) ?? "unknown",
      importance: v.importance as RoadmapImportance,
      comment: v.comment,
      at: v.updated_at,
    });
    feedback.set(v.item_id, list);
  }

  const adminItems: AdminItem[] = ((items ?? []) as RoadmapItem[]).map((item) => {
    const tally = tallies.get(item.id) ?? emptyTally();
    return {
      ...item,
      tally,
      score: demandScore(tally),
      feedback: (feedback.get(item.id) ?? []).sort((a, b) => b.at.localeCompare(a.at)),
    };
  });

  const adminIdeas: AdminIdea[] = ((ideas ?? []) as RoadmapIdea[]).map((idea) => ({
    ...idea,
    email: emailOf.get(idea.user_id) ?? "unknown",
  }));

  return <RoadmapAdmin items={adminItems} ideas={adminIdeas} />;
}
