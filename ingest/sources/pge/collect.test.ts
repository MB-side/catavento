import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { RegionLookup } from "../../core/regions";
import {
  cleanPgeName,
  goodDirections,
  possibleDirections,
  toSite,
  type PgeFeature,
} from "./collect";

const features = (
  JSON.parse(readFileSync(path.join(__dirname, "fixtures", "au.json"), "utf8")) as {
    features: PgeFeature[];
  }
).features;
const AU = { code: "AU", regions: new Set(["AU-ACT", "AU-NSW", "AU-WA"]) };
// Stand-in for the boundary lookup: west of 129°E is WA, else NSW (ACT near Canberra).
const regions = {
  regionFor: ({ lat, lon }: { lat: number; lon: number }) =>
    lon < 129
      ? "AU-WA"
      : lat < -35 && lat > -36 && lon > 148.7 && lon < 149.5
        ? "AU-ACT"
        : "AU-NSW",
} as unknown as RegionLookup;
const source = {
  providerId: "pge",
  fetchedAt: "2026-10-12T00:00:00.000Z",
  licence: "cc-by-sa-3.0" as const,
};
const byName = (n: string) => features.find((f) => f.properties.name.includes(n)) as PgeFeature;

describe("cleanPgeName", () => {
  it("unescapes quotes and drops a trailing state", () => {
    expect(cleanPgeName("Canberra, Lake George, Geary\\'s Gap", ["NSW"])).toBe(
      "Canberra, Lake George, Geary's Gap",
    );
    expect(cleanPgeName("Manilla, Mt Borah (NSW)", ["NSW", "VIC"])).toBe("Manilla, Mt Borah");
    expect(cleanPgeName("Something (XYZ)", ["NSW"])).toBe("Something (XYZ)");
  });
});

describe("toSite", () => {
  it("makes a community-layer site with its position, good directions and disciplines", () => {
    const { site } = toSite(byName("Borah"), AU, regions, source);
    expect(site).toMatchObject({
      id: "site:au:nsw:manilla-mt-borah",
      name: "Manilla, Mt Borah",
      layer: "pge",
      pgeId: "4632",
      status: "unknown",
      stewardRole: "unknown",
      disciplines: ["PG", "HG"],
      launches: [{ lat: -30.6789, lon: 150.609, precision: "exact" }],
    });
    expect(site?.sources[0]).toMatchObject({ providerId: "pge", licence: "cc-by-sa-3.0" });
    expect(site?.sources[0]?.url).toMatch(/^https:\/\/www\.paraglidingearth\.com\/\?site=4632$/);
    // Mt Borah is rated good from N round to W (not NW): one arc, clockwise from NNW to WNW.
    expect(goodDirections(byName("Borah").properties)).toEqual([
      "N",
      "NE",
      "E",
      "SE",
      "S",
      "SW",
      "W",
    ]);
    expect(site?.windRanges).toEqual([{ fromDeg: 337.5, toDeg: 292.5 }]);
  });

  it("uses no directions when none is rated good, and never copies descriptions", () => {
    // Mosman Park is rated only "possible" from the NE: not enough to show a direction.
    const { site } = toSite(byName("Mosman Park"), AU, regions, source);
    expect(site).toMatchObject({
      windRanges: [],
      windRangeLabel: "See official details",
      disciplines: ["PG"],
    });
    const all = features.map((f) => toSite(f, AU, regions, source).site);
    expect(JSON.stringify(all)).not.toContain("must not be copied");
  });

  it("reports a feature without a usable position", () => {
    const broken = {
      ...byName("Borah"),
      geometry: { type: "Point", coordinates: [Number.NaN, 0] },
    } as PgeFeature;
    expect(toSite(broken, AU, regions, source).warning).toMatch(/no usable position/);
  });
});

describe("toSite: extra facts (D81)", () => {
  it("keeps takeoff height, kinds of flying, landing and parking, and no text", () => {
    const { site } = toSite(byName("Manilla"), AU, regions, source);
    expect(site?.launches[0]?.altitudeM).toBe(895);
    expect(site?.flyingTypes).toEqual(["thermal", "soaring", "flatland"]);
    expect(site?.landings).toEqual([
      { name: "Main paddock", lat: -30.6831, lon: 150.597, altitudeM: 538 },
    ]);
    expect(site?.parking).toEqual([{ lat: -30.68, lon: 150.608, serves: "takeoff" }]);
    const json = JSON.stringify(site);
    expect(json).not.toContain("must not be copied");
    expect(json).not.toContain("0400 000 000");
  });

  it("keeps directions rated possible apart from the good ones", () => {
    const p = byName("Mosman").properties;
    expect(possibleDirections(p)).toEqual(["NE"]);
    expect(goodDirections(p)).toEqual([]);
    const { site } = toSite(byName("Mosman"), AU, regions, source);
    expect(site?.windRanges).toEqual([]);
    expect(site?.windMarginal).toEqual([{ fromDeg: 22.5, toDeg: 67.5 }]);
  });

  it("leaves out fields that aren't given", () => {
    const { site } = toSite(byName("Black Jack"), AU, regions, source);
    expect(site?.landings).toBeUndefined();
    expect(site?.parking).toBeUndefined();
  });
});
