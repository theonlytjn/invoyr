export type RoadmapStatus = "considering" | "planned" | "in_progress" | "launched";
export type RoadmapImportance = "not_important" | "nice_to_have" | "important" | "critical";
export type RoadmapIdeaStatus = "new" | "reviewed" | "merged" | "published" | "declined";

export interface RoadmapItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  status: RoadmapStatus;
  is_published: boolean;
  sort_order: number;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
}

/** The fields the public page needs. */
export type PublicRoadmapItem = Pick<
  RoadmapItem,
  "id" | "slug" | "title" | "summary" | "body" | "category" | "status" | "sort_order" | "launched_at"
>;

export const PUBLIC_ITEM_COLUMNS = "id, slug, title, summary, body, category, status, sort_order, launched_at";

export interface RoadmapVote {
  item_id: string;
  importance: RoadmapImportance;
  comment: string | null;
}

export interface RoadmapIdea {
  id: string;
  /** Null for a guest suggestion from a signed-out visitor. */
  user_id: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  title: string;
  details: string;
  status: RoadmapIdeaStatus;
  item_id: string | null;
  admin_note: string | null;
  created_at: string;
}
