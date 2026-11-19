import type { RoadmapImportance, RoadmapStatus } from "@/lib/roadmap/types";

/**
 * Copy and labels for the public roadmap (invoyr.io/roadmap) and its admin.
 * Kept here so wording changes don't touch components.
 */
export const ROADMAP_COPY = {
  metaTitle: "Roadmap",
  metaDescription:
    "See what we're building next at Invoyr, vote on what matters to you, and suggest new ideas.",
  kicker: "Roadmap",
  heading: "Shape what we build next",
  intro:
    "This is what we're working on, what we're weighing up, and what's shipped. Tell us how much each one matters to you, or suggest something new.",
  submitIdea: "Suggest an idea",
  signInToVote: "Sign in to vote",
  importanceQuestion: "How important is this to you?",
  commentLabel: "Anything to add? (optional)",
  commentPlaceholder: "How would you use it, or what would make it work for you?",
  saveComment: "Save comment",
  voteSaved: "Thanks. Your vote is saved.",
  voteError: "Couldn't save your vote. Please try again.",
  ideaIntro: "What would make Invoyr better for you? We read every suggestion.",
  ideaNameLabel: "Your name",
  ideaEmailLabel: "Your email",
  ideaEmailHint: "So we can follow up. We won't add you to any mailing list.",
  ideaTitleLabel: "Your idea",
  ideaTitlePlaceholder: "e.g. Let clients pay in instalments",
  ideaDetailsLabel: "Tell us more (optional)",
  ideaDetailsPlaceholder: "What problem would it solve for you? How do you handle it today?",
  ideaSubmit: "Send idea",
  ideaSuccessTitle: "Thanks, got it",
  ideaSuccessBody: "We read every suggestion. If it makes the roadmap, you'll see it here.",
  ideaError: "Couldn't send your idea. Please try again.",
  searchPlaceholder: "Search the roadmap",
  noResults: "Nothing matches that search.",
  emptyTab: {
    planned: "Nothing planned just yet. Suggest an idea and it could be first.",
    considering: "Nothing under consideration right now. Got an idea? Suggest it.",
    launched: "Nothing launched yet. Check back soon.",
  },
  close: "Close",
} as const;

export type RoadmapTab = "planned" | "considering" | "launched";

export const ROADMAP_TABS: { id: RoadmapTab; label: string; statuses: RoadmapStatus[] }[] = [
  { id: "planned", label: "Planned", statuses: ["in_progress", "planned"] },
  { id: "considering", label: "Considering", statuses: ["considering"] },
  { id: "launched", label: "Launched", statuses: ["launched"] },
];

export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  in_progress: "In progress",
  planned: "Up next",
  considering: "Considering",
  launched: "Launched",
};

export const ROADMAP_IMPORTANCE: { value: RoadmapImportance; label: string }[] = [
  { value: "not_important", label: "Not important" },
  { value: "nice_to_have", label: "Nice to have" },
  { value: "important", label: "Important" },
  { value: "critical", label: "Critical" },
];

/** Suggested categories for the admin form; free text is allowed too. */
export const ROADMAP_CATEGORIES = [
  "Invoicing",
  "Payments",
  "Clients",
  "Expenses",
  "Reporting",
  "Automation",
  "Team",
  "Integrations",
  "Mobile",
  "General",
] as const;
