import { describe, expect, it } from "vitest";
import { slicePath } from "@/components/domain/WindRose";
import { summarise } from "./site-summary";
import { mainLaunch, regionPath, regionSegmentOf, sitePath, stewardLabel } from "./sites";
import type { Site } from "./types";
import { takesWindFrom } from "./wind";

const base: Site = {
  id: "site:au:nsw:long-reef-ne",
  slug: "long-reef-ne",
  name: "Long Reef NE",
  country: "AU",
  regionCode: "AU-NSW",
  windRanges: [{ fromDeg: 22.5, toDeg: 67.5 }],
  windRangeLabel: "NNE–ENE",
  status: "open",
  stewardRole: "unknown",
  launches: [
    { id: "l0", name: "Hidden", precision: "withheld" },
    { id: "l1", name: "Launch", lat: -33.74, lon: 151.32, precision: "exact" },
  ],
  stationIds: [],
  disciplines: ["PG", "HG"],
  layer: "ansg",
  sources: [],
};

describe("paths", () => {
  it("builds site and region paths from IDs", () => {
    expect(regionSegmentOf("AU-NSW")).toBe("nsw");
    expect(sitePath(base)).toBe("/au/sites/nsw/long-reef-ne");
    expect(regionPath("NZ-CAN")).toBe("/nz/sites/can");
  });
});

describe("stewardLabel (docs/06 §6, D47)", () => {
  it.each([
    ["club", "managedBy"],
    ["national_body", "managedBy"],
    ["flight_park", "operatedBy"],
    ["operator", "operatedBy"],
    ["site_holder", "siteHolder"],
    ["landowner", "accessManagedBy"],
    ["municipality", "accessManagedBy"],
    ["none", "openSite"],
    ["unknown", "notListed"],
  ] as const)("%s → %s", (role, label) => {
    expect(stewardLabel({ ...base, stewardRole: role })).toBe(label);
  });

  it("shows a site guide's contact as a listed contact, never as Managed by", () => {
    expect(stewardLabel({ ...base, listedContact: { name: "SPHGC", providerId: "ansg" } })).toBe(
      "listedContact",
    );
  });
});

describe("mainLaunch and summaries", () => {
  it("uses the first launch with an exact position", () => {
    expect(mainLaunch(base)?.id).toBe("l1");
    expect(
      mainLaunch({ launches: [{ id: "x", name: "x", precision: "approximate", lat: 1, lon: 1 }] }),
    ).toBeUndefined();
  });

  it("summarises a site for the list, preferring a confirmed steward over a contact", () => {
    expect(
      summarise(base, "New South Wales", { steward: "Club A", contact: "Club B" }),
    ).toMatchObject({
      href: "/au/sites/nsw/long-reef-ne",
      regionName: "New South Wales",
      steward: "Club A",
      contact: undefined,
      windParsed: true,
      community: false,
      lat: -33.74,
    });
  });
});

describe("wind filter", () => {
  it("matches bearings inside a published arc, or any bearing for All", () => {
    expect(takesWindFrom(base.windRanges, 45)).toBe(true);
    expect(takesWindFrom(base.windRanges, 90)).toBe(false);
    expect(takesWindFrom("all", 200)).toBe(true);
    expect(takesWindFrom([], 45)).toBe(false);
  });
});

describe("WindRose slices", () => {
  it("draws the short or long way round as the arc requires", () => {
    expect(slicePath(50, 40, { fromDeg: 0, toDeg: 90 })).toBe(
      "M 50 50 L 50 10 A 40 40 0 0 1 90 50 Z",
    );
    expect(slicePath(50, 40, { fromDeg: 90, toDeg: 0 })).toContain("A 40 40 0 1 1");
    expect(slicePath(50, 40, { fromDeg: 0, toDeg: 360 })).toMatch(/^M 10 50 a 40 40/);
  });
});
