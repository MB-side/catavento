import { describe, expect, it } from "vitest";
import type { BuildWarning, EventItem } from "@/lib/types";
import { dedupeEvents } from "./events";

const event = (id: string, title: string, startDate: string, extra: Partial<EventItem> = {}): EventItem => ({
  id,
  title,
  startDate,
  type: "other",
  disciplines: [],
  country: "AU",
  url: `https://example.org/${id}`,
  sources: [{ providerId: "safa", url: "https://safa.asn.au/", fetchedAt: "2026-10-12", licence: "facts" }],
  ...extra,
});

describe("dedupeEvents", () => {
  it("keeps the first of two listings with the same title and day", () => {
    const warnings: BuildWarning[] = [];
    const out = dedupeEvents(
      [
        event("event:safa:1", "50th Anniversary of Free Flight", "2026-10-17"),
        event("event:club:1", "50th anniversary of free flight", "2026-10-17T00:00:00+11:00", {
          organiserOrgId: "org:au:flystanwell",
        }),
        event("event:club:2", "50th anniversary of free flight", "2026-10-18"),
      ],
      warnings,
    );
    expect(out.map((e) => e.id)).toEqual(["event:safa:1", "event:club:2"]);
    expect(out[0]?.organiserOrgId).toBe("org:au:flystanwell");
    expect(warnings.map((w) => w.code)).toEqual(["event-duplicate"]);
  });
});
