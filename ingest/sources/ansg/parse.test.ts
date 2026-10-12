// Parser tests against saved test copies (short facts only; descriptions removed).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RegionLookup } from "../../core/regions";
import { normaliseSites } from "./normalise";
import { parseCoordinates, parseDescription, parseSiteGuideKml } from "./parse";

const fixture = (name: string) => readFileSync(path.join(__dirname, "fixtures", name), "utf8");

describe("parseSiteGuideKml (open sites)", () => {
  const { sites, skipped } = parseSiteGuideKml(fixture("open.kml"), "open");
  const byName = new Map(sites.map((s) => [s.name, s]));

  it("finds each site once and ignores landings and other features", () => {
    expect(skipped).toEqual([]);
    expect(sites.length).toBeGreaterThanOrEqual(4);
    expect(new Set(sites.map((s) => s.siteGuideUrl)).size).toBe(sites.length);
  });

  it("reads the short header facts and the listed contact", () => {
    expect(byName.get("Avalon")).toMatchObject({
      siteGuideUrl: "https://siteguide.org.au/Sites/Details/Avalon",
      typeText: "Low Coastal Dune",
      heightText: "0 - 50ft / 15m",
      conditionsText: "NW",
      ratingText: "PG2 / HG Supervised",
      contact: { name: "HGAWA", url: "http://www.flywa.com.au" },
      status: "open",
      launches: [{ name: "Launch", lat: -32.57, lon: 115.65 }],
    });
  });

  it("groups a folder's launches under one site and trims the site name from launch names", () => {
    const bastion = byName.get("Bastion");
    expect(bastion?.launches.map((l) => l.name)).toEqual(["North Launch", "Sunset/West Launch"]);
  });

  it("drops long header text (prose) rather than copying it", () => {
    const barn = byName.get("Barn Hill (The Bluff)");
    expect(barn).toBeDefined();
    expect(barn?.conditionsText).toBeUndefined();
  });

  it("keeps no description text", () => {
    expect(JSON.stringify(sites)).not.toMatch(/Description removed|<p>|<b>/);
  });
});

describe("parseSiteGuideKml (closed sites)", () => {
  it("marks closed sites and skips launches without a site link", () => {
    const { sites, skipped } = parseSiteGuideKml(fixture("closed.kml"), "closed");
    expect(sites).toEqual([
      expect.objectContaining({ name: "Example Closed Hill", status: "closed", ratingText: "PG3" }),
    ]);
    expect(skipped).toEqual(["Broken entry"]);
  });
});

describe("helpers", () => {
  it("parse coordinates in either spacing", () => {
    expect(parseCoordinates("152.8423, -31.5948")).toEqual({ lat: -31.5948, lon: 152.8423 });
    expect(parseCoordinates("152.8,-31.5,0")).toEqual({ lat: -31.5, lon: 152.8 });
    expect(parseCoordinates("nonsense")).toBeUndefined();
  });

  it("ignore descriptions without a Contact/Responsible line", () => {
    expect(parseDescription("<table></table>").contact).toBeUndefined();
  });
});

describe("normaliseSites", () => {
  const { sites: parsed } = parseSiteGuideKml(fixture("open.kml"), "open");
  const { sites, invalid } = normaliseSites(parsed, {
    country: "AU",
    allowedRegions: new Set([
      "AU-NSW",
      "AU-VIC",
      "AU-QLD",
      "AU-SA",
      "AU-WA",
      "AU-TAS",
      "AU-ACT",
      "AU-NT",
    ]),
    regions: RegionLookup.fromFile(),
    fetchedAt: "2026-10-12T00:00:00.000Z",
    contentHash: "abc",
  });
  const byName = new Map(sites.map((s) => [s.name, s]));

  it("places each site in its state from the launch position", () => {
    expect(invalid).toBe(0);
    expect(byName.get("Avalon")?.regionCode).toBe("AU-WA");
    expect(byName.get("Bartletts Reserve - NE Bonnys")?.regionCode).toBe("AU-NSW");
    expect(byName.get("Barn Hill (The Bluff)")?.regionCode).toBe("AU-SA");
  });

  it("builds IDs, wind ranges, launches and the Site Guide credit", () => {
    expect(byName.get("Avalon")).toMatchObject({
      id: "site:au:wa:avalon",
      windRanges: [{ fromDeg: 292.5, toDeg: 337.5 }],
      windRangeLabel: "WNW–NNW",
      disciplines: ["PG", "HG"],
      layer: "ansg",
      launches: [{ id: "site:au:wa:avalon:launch:1", precision: "exact" }],
      sources: [{ providerId: "ansg", url: "https://siteguide.org.au/Sites/Details/Avalon" }],
    });
  });

  it("records the listed contact without naming a steward (D47)", () => {
    expect(byName.get("Avalon")).toMatchObject({
      stewardRole: "unknown",
      listedContact: { name: "HGAWA", url: "http://www.flywa.com.au", providerId: "ansg" },
    });
    expect(byName.get("Avalon")?.stewardOrgId).toBeUndefined();
  });

  it("shows 'See official details' when the directions are prose", () => {
    expect(byName.get("Barn Hill (The Bluff)")).toMatchObject({
      windRanges: [],
      windRangeLabel: "See official details",
    });
  });
});
