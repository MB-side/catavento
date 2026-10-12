import { describe, expect, it } from "vitest";
import type { BuildWarning, CollectedOrg, Organisation } from "@/lib/types";
import { OrgMatcher, normaliseName } from "./match";
import { mergeCollectedOrgs } from "./orgs";

const seedSrc = { providerId: "manual", url: "https://example.org/", fetchedAt: "2026-10-09", licence: "facts" as const };
const safaSrc = { providerId: "safa", url: "https://safa.asn.au/local-clubs/", fetchedAt: "2026-10-12T05:00:00.000Z", licence: "facts" as const };

const org = (id: string, name: string, kind: Organisation["kind"], extra: Partial<Organisation> = {}): Organisation => ({
  id,
  slug: id.split(":")[2] ?? id,
  kind,
  name,
  disciplines: [],
  country: "AU",
  sources: [seedSrc],
  lastVerified: "2026-10-09",
  verificationStatus: "needs_verification",
  ...extra,
});

const collected = (id: string, name: string, kind: "club" | "school", extra: Partial<CollectedOrg> = {}): CollectedOrg => ({
  id,
  providerId: "safa",
  kind,
  name,
  country: "AU",
  disciplines: [],
  source: safaSrc,
  ...extra,
});

describe("normaliseName", () => {
  it("ignores case, '&' versus 'and', punctuation and a trailing Inc", () => {
    expect(normaliseName("Tasmanian Hang-gliding & Paragliding Association Inc.")).toBe(
      normaliseName("tasmanian hang gliding and paragliding association"),
    );
  });
});

describe("OrgMatcher", () => {
  const orgs = [
    org("org:au:qsa", "Queensland Sports Aviators (QSA)", "regional_association"),
    org("org:au:manilla", "Manilla Paragliding", "school"),
    org("org:au:manilla-cairns", "Manilla Paragliding (Cairns)", "school"),
  ];
  const m = new OrgMatcher(orgs, { AU: { "Victorian HG and PG Association": "org:au:qsa" } });

  it("finds a name without its bracketed short name, and the short name alone", () => {
    expect(m.find("AU", "Queensland Sports Aviators Inc.")?.org.id).toBe("org:au:qsa");
    expect(m.find("AU", "QSA")?.org.id).toBe("org:au:qsa");
  });

  it("prefers a full name over a shortened one", () => {
    expect(m.find("AU", "Manilla Paragliding")?.org.id).toBe("org:au:manilla");
  });

  it("uses aliases, and never matches across countries", () => {
    expect(m.find("AU", "Victorian HG and PG Association")).toMatchObject({ rule: "alias" });
    expect(m.find("NZ", "QSA")).toBeUndefined();
  });
});

describe("mergeCollectedOrgs", () => {
  it("refreshes a matching organisation and records the national body's listing", () => {
    const orgs = [org("org:au:canungra", "Canungra Hang Gliding Club Inc", "club", { website: "http://old.example" })];
    const warnings: BuildWarning[] = [];
    const { organisations, associationNames } = mergeCollectedOrgs(
      [collected("safa:club:CG", "Canungra Hang Gliding Club Inc", "club", {
        website: "https://www.flycanungra.com.au/",
        regionCode: "AU-QLD",
        associationName: "Queensland Sports Aviators Inc.",
      })],
      orgs,
      new OrgMatcher(orgs, {}),
      warnings,
    );
    expect(organisations).toHaveLength(1);
    expect(organisations[0]).toMatchObject({
      website: "https://www.flycanungra.com.au/",
      regionCode: "AU-QLD",
      verificationStatus: "listed_by_national_body",
      lastVerified: "2026-10-12",
    });
    expect(organisations[0]?.sources.map((s) => s.providerId)).toEqual(["manual", "safa"]);
    expect(associationNames.get("org:au:canungra")?.name).toBe("Queensland Sports Aviators Inc.");
    expect(warnings).toEqual([]);
  });

  it("adds an organisation the directory lacks, and keeps a school apart from a same-named club", () => {
    const orgs = [org("org:au:skyhigh", "Skyhigh", "club")];
    const warnings: BuildWarning[] = [];
    const { organisations } = mergeCollectedOrgs(
      [
        collected("safa:club:TM", "Manilla Skysailors Inc", "club", { regionCode: "AU-NSW" }),
        collected("safa:school:skyhigh", "Skyhigh", "school", { disciplines: ["PG"] }),
      ],
      orgs,
      new OrgMatcher(orgs, {}),
      warnings,
    );
    expect(organisations.map((o) => [o.id, o.kind])).toEqual([
      ["org:au:skyhigh", "club"],
      ["org:au:manilla-skysailors", "club"],
      ["org:au:skyhigh-2", "school"],
    ]);
    expect(organisations.find((o) => o.kind === "school")?.nationalBodyListed).toBe(true);
    expect(warnings.map((w) => w.code).sort()).toEqual(["org-added", "org-added", "org-kind-mismatch"]);
  });
});
