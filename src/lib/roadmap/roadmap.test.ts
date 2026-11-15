import { describe, expect, it } from "vitest";
import { demandScore, groupByCategory, groupByLaunchMonth, groupByStatus, matchesSearch } from "./group";
import { ideaSchema, itemSchema, slugify, voteSchema } from "./schema";
import type { PublicRoadmapItem } from "./types";
import { ROADMAP_STATUS_LABELS } from "@/config/roadmap";

const item = (over: Partial<PublicRoadmapItem>): PublicRoadmapItem => ({
  id: crypto.randomUUID(),
  slug: "x",
  title: "Item",
  summary: "",
  body: "",
  category: "General",
  status: "considering",
  sort_order: 0,
  launched_at: null,
  ...over,
});

describe("groupByStatus", () => {
  it("orders sections and drops empty ones", () => {
    const sections = groupByStatus(
      [item({ status: "planned", title: "B" }), item({ status: "planned", title: "A" })],
      ["in_progress", "planned"],
      ROADMAP_STATUS_LABELS,
    );
    expect(sections.map((s) => s.label)).toEqual(["Up next"]);
    expect(sections[0].items.map((i) => i.title)).toEqual(["A", "B"]);
  });

  it("sort_order beats title", () => {
    const [s] = groupByStatus(
      [item({ status: "planned", title: "A", sort_order: 2 }), item({ status: "planned", title: "Z", sort_order: 1 })],
      ["planned"],
      ROADMAP_STATUS_LABELS,
    );
    expect(s.items.map((i) => i.title)).toEqual(["Z", "A"]);
  });
});

describe("groupByCategory", () => {
  it("is alphabetical with General last", () => {
    const sections = groupByCategory([
      item({ category: "General" }),
      item({ category: "Payments" }),
      item({ category: "Clients" }),
    ]);
    expect(sections.map((s) => s.label)).toEqual(["Clients", "Payments", "General"]);
  });
});

describe("groupByLaunchMonth", () => {
  it("groups newest month first, undated last", () => {
    const sections = groupByLaunchMonth([
      item({ launched_at: "2026-09-02" }),
      item({ launched_at: null }),
      item({ launched_at: "2026-11-10" }),
      item({ launched_at: "2026-11-01" }),
    ]);
    expect(sections.map((s) => s.label)).toEqual(["November 2026", "September 2026", "Earlier"]);
    expect(sections[0].items.map((i) => i.launched_at)).toEqual(["2026-11-10", "2026-11-01"]);
  });
});

describe("matchesSearch", () => {
  it("matches any text field, case-insensitively", () => {
    const i = item({ title: "Instalments", body: "Split a payment" });
    expect(matchesSearch(i, "SPLIT")).toBe(true);
    expect(matchesSearch(i, "xero")).toBe(false);
    expect(matchesSearch(i, "  ")).toBe(true);
  });
});

describe("demandScore", () => {
  it("weights critical highest and ignores not important", () => {
    expect(demandScore({ critical: 1, important: 1, nice_to_have: 1, not_important: 5 })).toBe(6);
  });
});

describe("schemas", () => {
  it("vote: null importance removes, blank comment becomes null", () => {
    const v = voteSchema.parse({ itemId: crypto.randomUUID(), importance: null, comment: "  " });
    expect(v.importance).toBeNull();
    expect(v.comment).toBeNull();
  });

  it("vote: rejects unknown importance", () => {
    expect(voteSchema.safeParse({ itemId: crypto.randomUUID(), importance: "meh" }).success).toBe(false);
  });

  it("idea: needs a real title", () => {
    expect(ideaSchema.safeParse({ title: "ab" }).success).toBe(false);
    expect(ideaSchema.parse({ title: " Instalments " })).toEqual({ title: "Instalments", details: "" });
  });

  it("item: validates slug and defaults", () => {
    expect(itemSchema.safeParse({ title: "Hello", slug: "Bad Slug" }).success).toBe(false);
    expect(itemSchema.parse({ title: "Hello" }).status).toBe("considering");
  });

  it("slugify", () => {
    expect(slugify("  Pay in Instalments (beta)! ")).toBe("pay-in-instalments-beta");
    expect(slugify("Café & Xero")).toBe("cafe-xero");
  });
});
