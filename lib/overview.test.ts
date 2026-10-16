import { describe, expect, it } from "vitest";
import {
  isGroup,
  mapSiteToSummary,
  overviewSiteHref,
  siteAnchor,
  toMapSite,
  worldPath,
} from "./overview";
import type { OverviewRegion, OverviewSite } from "./types";

const europe: OverviewRegion = {
  slug: "europe",
  name: "Europe",
  countries: [
    { code: "FR", name: "France" },
    { code: "CH", name: "Switzerland" },
  ],
};
const nepal: OverviewRegion = {
  slug: "nepal",
  name: "Nepal",
  countries: [{ code: "NP", name: "Nepal" }],
};
const site: OverviewSite = {
  id: "pge:123",
  name: "Col",
  country: "FR",
  lat: 45.1,
  lon: 6.2,
  windRanges: [{ fromDeg: 270, toDeg: 315 }],
  windMarginal: [{ fromDeg: 225, toDeg: 270 }],
  windLabel: "W–NW",
  disciplines: ["PG"],
  url: "https://www.paraglidingearth.com/?site=123",
  fetchedAt: "2026-10-13T00:00:00.000Z",
};

describe("overview paths (D83)", () => {
  it("builds region and country paths", () => {
    expect(worldPath()).toBe("/world");
    expect(worldPath(europe)).toBe("/world/europe");
    expect(worldPath(europe, "FR")).toBe("/world/europe/fr");
    expect(isGroup(europe)).toBe(true);
    expect(isGroup(nepal)).toBe(false);
  });

  it("points a pin at the site's entry on its country's page, or the destination's page", () => {
    expect(siteAnchor(site)).toBe("site-123");
    expect(overviewSiteHref(europe, site)).toBe("/world/europe/fr/#site-123");
    expect(overviewSiteHref(nepal, { ...site, country: "NP" })).toBe("/world/nepal/#site-123");
  });
});

describe("map records", () => {
  it("carries what the map and outlook need, and turns back into a summary", () => {
    const m = toMapSite(europe, site);
    expect(m).toEqual({
      i: "pge:123",
      n: "Col",
      c: "FR",
      a: 45.1,
      o: 6.2,
      w: "W–NW",
      r: [{ fromDeg: 270, toDeg: 315 }],
      m: [{ fromDeg: 225, toDeg: 270 }],
      h: "/world/europe/fr/#site-123",
    });
    expect(mapSiteToSummary(m, "France")).toMatchObject({
      name: "Col",
      regionName: "France",
      windParsed: true,
      community: true,
      href: "/world/europe/fr/#site-123",
      externalHref: "https://www.paraglidingearth.com/?site=123",
    });
  });

  it("leaves wind out when no direction is rated good", () => {
    const m = toMapSite(europe, { ...site, windRanges: [], windMarginal: undefined });
    expect(m.w).toBeUndefined();
    expect(mapSiteToSummary(m, "France").windParsed).toBe(false);
  });
});
