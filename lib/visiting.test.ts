import { describe, expect, it } from "vitest";
import type { VisitorHelp } from "./types";
import { serviceCounts, sortHelp, sortServices, visitingHref, visitingPath } from "./visiting";

const help = (name: string, services: VisitorHelp["services"]): VisitorHelp => ({
  id: `help:fr:${name}`,
  country: "FR",
  name,
  services,
  source: "https://example.org/",
  checked: "2026-10-16",
});

describe("visiting", () => {
  it("builds paths in lower case", () => {
    expect(visitingPath()).toBe("/visiting");
    expect(visitingPath("FR")).toBe("/visiting/fr");
  });
  it("orders services with the most visitor-specific first, without duplicates", () => {
    expect(sortServices(["tandem", "shuttle", "site-briefing", "shuttle"])).toEqual([
      "site-briefing",
      "shuttle",
      "tandem",
    ]);
  });
  it("counts businesses per service and leaves out services nobody offers", () => {
    expect(serviceCounts([help("A", ["guiding", "tandem"]), help("B", ["guiding"])])).toEqual([
      { service: "guiding", count: 2 },
      { service: "tandem", count: 1 },
    ]);
  });
  it("lists businesses with briefings or guiding before tandem-only ones", () => {
    const sorted = sortHelp([
      help("Zed", ["tandem"]),
      help("Bee", ["guiding"]),
      help("Ace", ["site-briefing"]),
    ]);
    expect(sorted.map((h) => h.name)).toEqual(["Ace", "Bee", "Zed"]);
  });
});

describe("visitingHref", () => {
  it("keeps Australia and New Zealand in their own sections", () => {
    expect(visitingHref({ code: "AU", group: "home" })).toBe("/au/visiting-pilots/");
    expect(visitingHref({ code: "FR", group: "europe" })).toBe("/visiting/fr/");
  });
});
