import { describe, expect, it } from "vitest";
import type { BuildWarning, Organisation, Station } from "@/lib/types";
import {
  applyOrgMerges,
  applyOverrides,
  applyRelated,
  deriveClubs,
  mapOfferings,
  mapSampleSites,
  resolveAlias,
} from "./merge";
import type { SeedOrg } from "./seed";

const source = { providerId: "safa", url: "https://safa.asn.au/", fetchedAt: "2026-10-08", licence: "facts" as const };

function seedOrg(legacyId: string, fields: Partial<SeedOrg> = {}): SeedOrg {
  return {
    legacyId,
    kind: "school",
    name: legacyId,
    disciplines: ["PG"],
    country: "AU",
    sources: [source],
    lastVerified: "2026-10-08",
    verificationStatus: "verified_public_source",
    ...fields,
  };
}

function org(id: string, legacyId: string, fields: Partial<Organisation> = {}): Organisation {
  return { ...seedOrg(legacyId), id, slug: id.split(":")[2] ?? id, ...fields };
}

describe("applyOrgMerges", () => {
  it("folds a shop row into its school and adds the shop's kind", () => {
    const warnings: BuildWarning[] = [];
    const result = applyOrgMerges(
      [
        seedOrg("SCH-1"),
        seedOrg("RTL-1", {
          kind: "retailer",
          disciplines: ["PPG"],
          name: "Shop",
          sources: [{ ...source, url: "https://shop.example/" }],
        }),
      ],
      [{ from: "RTL-1", into: ["SCH-1"] }],
      warnings,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      legacyId: "SCH-1",
      kind: "school",
      additionalKinds: ["retailer"],
      disciplines: ["PG", "PPG"],
      aliases: ["Shop"],
    });
    expect(result[0]?.sources).toHaveLength(2);
    expect(warnings).toEqual([]);
  });

  it("warns about unknown rows instead of failing", () => {
    const warnings: BuildWarning[] = [];
    applyOrgMerges([seedOrg("A")], [{ from: "NOPE", into: ["A"] }], warnings);
    expect(warnings[0]?.code).toBe("merge-missing");
  });
});

describe("applyRelated", () => {
  it("cross-links every member of a group", () => {
    const a = org("org:au:a", "A");
    const b = org("org:au:b", "B");
    applyRelated([a, b], [{ ids: ["A", "B"] }], []);
    expect(a.relatedOrgIds).toEqual(["org:au:b"]);
    expect(b.relatedOrgIds).toEqual(["org:au:a"]);
  });
});

describe("applyOverrides (manual always wins)", () => {
  it("matches by record ID or legacy ID and ignores note/source", () => {
    const records = [org("org:nz:a", "NZ-A"), org("org:nz:b", "NZ-B")];
    const used = applyOverrides(records, {
      "NZ-A": { regionCode: "NZ-CAN", source: "https://x.example", note: "why" },
      "org:nz:b": { hidden: true },
      "org:nz:zzz": { hidden: true },
    });
    expect(records[0]).toMatchObject({ regionCode: "NZ-CAN" });
    expect(records[0]).not.toHaveProperty("source");
    expect(records[0]).not.toHaveProperty("note");
    expect(records[1]?.hidden).toBe(true);
    expect([...used].sort()).toEqual(["NZ-A", "org:nz:b"]);
  });
});

describe("resolveAlias", () => {
  const orgs = [org("org:au:sphgc", "CLB-024", { kind: "club" })];
  const aliases = { AU: { "Sydney Paragliding & Hang Gliding Club": "CLB-024" }, NZ: null };

  it("resolves exact spellings within the same country", () => {
    expect(resolveAlias("Sydney Paragliding & Hang Gliding Club", "AU", aliases, orgs)).toBe("org:au:sphgc");
  });

  it("never guesses", () => {
    expect(resolveAlias("Sydney Paragliding Club", "AU", aliases, orgs)).toBeUndefined();
    expect(resolveAlias("Sydney Paragliding & Hang Gliding Club", "NZ", aliases, orgs)).toBeUndefined();
  });
});

describe("mapSampleSites and deriveClubs", () => {
  const orgs = [
    org("org:nz:auckland-club", "NZ-CLB-007", { kind: "club", country: "NZ" }),
    org("org:nz:highside", "NZ-FP-001", { kind: "flight_park", country: "NZ" }),
  ];

  it("builds steward-first sites and links clubs both ways", () => {
    const warnings: BuildWarning[] = [];
    const sites = mapSampleSites(
      [
        {
          name: "Karioitahi Beach (HighSide)",
          region: "NZ-AUK",
          steward: { legacyId: "NZ-FP-001", role: "flight_park" },
          alsoAdministeredBy: { legacyId: "NZ-CLB-007", note: "Publishes the guide" },
          source: "https://www.highside.nz",
        },
        { name: "Coronet Peak", region: "NZ-OTA", steward: { role: "unknown" }, source: "https://x.example" },
      ],
      orgs,
      "2026-10-09",
      warnings,
    );
    expect(sites[0]).toMatchObject({
      id: "site:nz:auk:karioitahi-beach",
      stewardRole: "flight_park",
      stewardOrgId: "org:nz:highside",
      alsoAdministeredBy: [{ orgId: "org:nz:auckland-club" }],
      windRanges: [],
      windRangeLabel: "See official details",
      sources: [{ providerId: "manual", fetchedAt: "2026-10-09" }],
    });
    expect(sites[1]).toMatchObject({ stewardRole: "unknown", stewardOrgId: undefined });
    expect(warnings).toEqual([]);

    const station: Station = {
      id: "station:holfuy:213",
      providerId: "holfuy",
      providerRef: "213",
      name: "Kario",
      country: "NZ",
      url: "https://holfuy.com/en/weather/213",
      ownerOrgId: "org:nz:auckland-club",
      embedAllowed: false,
      feedAllowed: false,
      verificationStatus: "verified_public_source",
    };
    const club = deriveClubs(orgs, sites, [station]).find((o) => o.id === "org:nz:auckland-club");
    expect(club).toMatchObject({ siteIds: ["site:nz:auk:karioitahi-beach"], stationIds: ["station:holfuy:213"] });
  });
});

describe("mapOfferings", () => {
  const orgs = [org("org:au:manilla-paragliding", "SCH-014", { name: "Manilla Paragliding" })];
  const countries = [
    {
      code: "AU",
      name: "Australia",
      enabled: true,
      regionLabel: "State",
      regions: ["AU-NSW"],
      timezones: ["Australia/Sydney"],
      currency: "AUD",
      defaultUnits: { speed: "kmh" as const, altitude: "m" as const },
      nationalBody: { orgId: "x", name: "x", url: "https://x.example", membershipLine: "x" },
      ratingsNote: "x",
      primarySiteSource: "ansg",
      coverage: "full" as const,
    },
  ];
  const base = {
    org: "Manilla Paragliding",
    type: "licence_course" as const,
    title: "PG2",
    priceFromAud: 2890,
    url: "https://www.flymanilla.com/",
    sourceCheckedAt: "2026-10-08",
  };

  it("attaches the organisation's currency to published prices", () => {
    const [offer] = mapOfferings([base], orgs, countries, new Map(), []);
    expect(offer).toMatchObject({ orgId: "org:au:manilla-paragliding", priceFrom: 2890, currency: "AUD" });
  });

  it("refuses ambiguous or unknown organisations", () => {
    const warnings: BuildWarning[] = [];
    expect(mapOfferings([{ ...base, org: "Nobody" }], orgs, countries, new Map(), warnings)).toEqual([]);
    expect(warnings[0]?.code).toBe("offering-org");
  });
});
