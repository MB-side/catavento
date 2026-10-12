import { describe, expect, it } from "vitest";
import type { BuildWarning, Organisation, Site } from "@/lib/types";
import { dedupeSites, matchListedContacts, normaliseName, normaliseUrl } from "./sites";

const src = { providerId: "ansg", url: "https://siteguide.org.au/", fetchedAt: "2026-10-12", licence: "facts" as const };

function site(id: string, layer: Site["layer"], lat: number, lon: number, extra: Partial<Site> = {}): Site {
  return {
    id,
    slug: id.split(":").pop() ?? id,
    name: id,
    country: "AU",
    regionCode: "AU-NSW",
    windRanges: [],
    windRangeLabel: "See official details",
    status: "open",
    stewardRole: "unknown",
    launches: [{ id: `${id}:launch:1`, name: "Launch", lat, lon, precision: "exact" }],
    stationIds: [],
    disciplines: [],
    layer,
    sources: [src],
    ...extra,
  };
}

const org = (id: string, website: string, legacyId?: string): Organisation => ({
  id,
  legacyId,
  slug: id,
  kind: "regional_association",
  name: id,
  disciplines: [],
  country: "AU",
  website,
  sources: [src],
  lastVerified: "2026-10-12",
  verificationStatus: "verified_public_source",
});

describe("normaliseUrl", () => {
  it("ignores scheme, www, case and trailing slashes", () => {
    expect(normaliseUrl("http://www.FlyWA.com.au/")).toBe("flywa.com.au");
    expect(normaliseUrl("https://sites.google.com/site/sahpgahome/")).toBe("sites.google.com/site/sahpgahome");
    expect(normaliseUrl("not a url")).toBeUndefined();
  });
});

describe("matchListedContacts", () => {
  const orgs = [
    org("org:au:hgawa", "http://flywa.com.au"),
    org("org:au:sahpga", "https://sites.google.com/site/sahpgahome"),
    org("org:au:other", "https://sites.google.com/site/somethingelse"),
  ];

  it("matches exact website addresses within the same country", () => {
    const s = [
      site("a", "ansg", -32, 115, { listedContact: { name: "HGAWA", url: "http://www.flywa.com.au", providerId: "ansg" } }),
      site("b", "ansg", -33, 138, { listedContact: { name: "SAHPGA", url: "https://sites.google.com/site/sahpgahome/", providerId: "ansg" } }),
    ];
    matchListedContacts(s, orgs, {}, []);
    expect(s.map((x) => x.listedContact?.orgId)).toEqual(["org:au:hgawa", "org:au:sahpga"]);
  });

  it("uses exact aliases and otherwise reports, never guesses", () => {
    const warnings: BuildWarning[] = [];
    const s = [
      site("c", "ansg", -31, 152, { listedContact: { name: "MNCF", url: "https://mncf.tidyhq.com", providerId: "ansg" } }),
      site("d", "ansg", -31, 152, { listedContact: { name: "The HGAWA crew", url: "https://crew.example", providerId: "ansg" } }),
    ];
    matchListedContacts(s, orgs, { AU: { MNCF: "org:au:other" } }, warnings);
    expect(s[0]?.listedContact?.orgId).toBe("org:au:other");
    expect(s[1]?.listedContact?.orgId).toBeUndefined();
    expect(warnings.map((w) => w.code)).toEqual(["contact-unmatched"]);
  });
});

describe("matchListedContacts: names and privacy", () => {
  const clubs = [
    { ...org("org:au:acthpa", ""), website: undefined, name: "ACT Hang-gliding and Paragliding Association (ACTHPA)" },
    { ...org("org:au:igc", ""), website: undefined, name: "Illawarra Gliding Club Inc" },
    { ...org("org:au:sky", ""), website: undefined, name: "Skyhigh Paragliding Club Inc", legacyId: "CLB-018" },
  ];

  it("normalises names, ignoring a trailing Inc", () => {
    expect(normaliseName("  Illawarra  Gliding Club Inc. ")).toBe("illawarra gliding club");
    expect(normaliseName("FlyStanwell Incorporated")).toBe("flystanwell");
  });

  it("matches a full name or the bracketed short name, and shows the organisation's name", () => {
    const s = [
      site("a", "ansg", -35, 149, { listedContact: { name: "ACTHPA", url: "https://acthpa.org/info/about/", providerId: "ansg" } }),
      site("b", "ansg", -34, 150, { listedContact: { name: "Illawarra Gliding Club", url: "https://igc.example/", providerId: "ansg" } }),
    ];
    matchListedContacts(s, clubs, {}, []);
    expect(s.map((x) => x.listedContact?.orgId)).toEqual(["org:au:acthpa", "org:au:igc"]);
    expect(s[0]?.listedContact?.name).toBe("ACT Hang-gliding and Paragliding Association (ACTHPA)");
  });

  it("matches an alias keyed by web address and replaces a person's name with the club's", () => {
    const s = [site("c", "ansg", -37, 145, { listedContact: { name: "Club - A Person", url: "http://www.skyhigh.example", providerId: "ansg" } })];
    matchListedContacts(s, clubs, { AU: { "skyhigh.example": "CLB-018" } }, []);
    expect(s[0]?.listedContact).toMatchObject({ orgId: "org:au:sky", name: "Skyhigh Paragliding Club Inc" });
  });

  it("drops unmatched contacts with no link or a weather link", () => {
    const warnings: BuildWarning[] = [];
    const s = [
      site("d", "ansg", -33, 151, { listedContact: { name: "A Person", providerId: "ansg" } }),
      site("e", "ansg", -35, 118, { listedContact: { name: "Weather", url: "http://wind.willyweather.com.au/wa/x.html", providerId: "ansg" } }),
      site("f", "ansg", -33, 151, { listedContact: { name: "Some Club", url: "https://someclub.example", providerId: "ansg" } }),
    ];
    matchListedContacts(s, clubs, {}, warnings);
    expect(s.map((x) => x.listedContact?.name)).toEqual([undefined, undefined, "Some Club"]);
    expect(warnings.map((w) => w.code).sort()).toEqual(["contact-dropped", "contact-dropped", "contact-unmatched"]);
  });
});

describe("dedupeSites (docs/05 §5.3)", () => {
  it("drops a community-layer site within 250 m of a Site Guide launch", () => {
    const warnings: BuildWarning[] = [];
    const out = dedupeSites([site("ansg:a", "ansg", -30, 150), site("pge:a", "pge", -30.001, 150)], warnings);
    expect(out.map((s) => s.id)).toEqual(["ansg:a"]);
    expect(warnings[0]?.code).toBe("dedupe-merged");
  });

  it("keeps but reports one 250–400 m away, and keeps distant ones quietly", () => {
    const warnings: BuildWarning[] = [];
    const out = dedupeSites(
      [site("ansg:a", "ansg", -30, 150), site("pge:near", "pge", -30.003, 150), site("pge:far", "pge", -31, 150)],
      warnings,
    );
    expect(out.map((s) => s.id)).toEqual(["ansg:a", "pge:near", "pge:far"]);
    expect(warnings.map((w) => w.code)).toEqual(["dedupe-near"]);
  });

  it("never merges records from the same provider", () => {
    const out = dedupeSites([site("ansg:a", "ansg", -30, 150), site("ansg:b", "ansg", -30.0001, 150)], []);
    expect(out).toHaveLength(2);
  });
});
