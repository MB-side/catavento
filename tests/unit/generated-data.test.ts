// Checks on the committed data/generated files: valid, consistent, attributed, and up to date.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  anyOrganisationSchema,
  countrySchema,
  offeringSchema,
  providerSchema,
  resourceSchema,
  siteSchema,
  stationSchema,
} from "@/lib/schemas";
import type { SourceRef } from "@/lib/types";
import { buildData } from "@/scripts/lib/data/build";
import { readInputs } from "@/scripts/lib/data/inputs";

const read = (file: string): unknown =>
  JSON.parse(readFileSync(path.join(process.cwd(), "data", "generated", file), "utf8"));

const providers = z.array(providerSchema).parse(read("providers.json"));
const countries = z.array(countrySchema).parse(read("countries.json"));
const organisations = z.array(anyOrganisationSchema).parse(read("organisations.json"));
const sites = z.array(siteSchema).parse(read("sites.json"));
const stations = z.array(stationSchema).parse(read("stations.json"));
const offerings = z.array(offeringSchema).parse(read("offerings.json"));
const resources = z.array(resourceSchema).parse(read("resources.json"));

const allSources: SourceRef[] = [
  ...organisations.flatMap((o) => o.sources),
  ...sites.flatMap((s) => s.sources),
  ...offerings.map((o) => o.source),
];

describe("generated data", () => {
  it("is up to date with the seed and manual files (run `pnpm build:data`)", () => {
    const fresh = buildData(readInputs());
    expect(fresh.organisations).toEqual(organisations);
    expect(fresh.sites).toEqual(sites);
    expect(fresh.stations).toEqual(stations);
    expect(fresh.providers).toEqual(providers);
    expect(fresh.countries).toEqual(countries);
  });

  it("has unique IDs", () => {
    for (const list of [organisations, sites, stations, resources]) {
      const ids = list.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("credits every record to a known provider", () => {
    const known = new Set(providers.map((p) => p.id));
    for (const s of allSources) expect(known.has(s.providerId), s.providerId).toBe(true);
    for (const st of stations) expect(known.has(st.providerId), st.providerId).toBe(true);
  });

  it("never takes data from red-tier providers (links only)", () => {
    const red = new Set(providers.filter((p) => p.tier === "red").map((p) => p.id));
    for (const s of allSources) expect(red.has(s.providerId), s.url).toBe(false);
  });

  it("keeps embeds and feeds off for every station", () => {
    for (const s of stations) {
      expect(s.embedAllowed).toBe(false);
      expect(s.feedAllowed).toBe(false);
    }
  });

  it("only refers to organisations, stations and countries that exist", () => {
    const orgIds = new Set(organisations.map((o) => o.id));
    const stationIds = new Set(stations.map((s) => s.id));
    const countryCodes = new Set(countries.map((c) => c.code));
    for (const s of sites) {
      if (s.stewardOrgId) expect(orgIds.has(s.stewardOrgId), s.id).toBe(true);
      for (const a of s.alsoAdministeredBy ?? []) expect(orgIds.has(a.orgId), s.id).toBe(true);
      for (const id of s.stationIds) expect(stationIds.has(id), s.id).toBe(true);
      expect(countryCodes.has(s.country)).toBe(true);
    }
    for (const o of organisations) {
      expect(countryCodes.has(o.country), o.id).toBe(true);
      for (const r of o.relatedOrgIds ?? []) expect(orgIds.has(r), o.id).toBe(true);
    }
    for (const c of countries) expect(orgIds.has(c.nationalBody.orgId), c.code).toBe(true);
  });

  it("keeps each record's region inside its own country", () => {
    const regions = new Map(countries.map((c) => [c.code, new Set(c.regions)]));
    for (const r of [...organisations, ...sites]) {
      if (r.regionCode) expect(regions.get(r.country)?.has(r.regionCode), r.id).toBe(true);
    }
  });

  it("does not credit SAFA for New Zealand records", () => {
    for (const r of [...organisations, ...sites].filter((x) => x.country === "NZ")) {
      for (const s of r.sources) expect(s.providerId, r.id).not.toBe("safa");
    }
  });

  it("links clubs and the sites they steward both ways", () => {
    for (const s of sites.filter((x) => x.stewardRole === "club" && x.stewardOrgId)) {
      const steward = organisations.find((o) => o.id === s.stewardOrgId);
      expect(steward, s.id).toBeDefined();
      // Regional associations (e.g. ACTHPA) can manage sites too; only clubs carry siteIds so far.
      if (steward && "siteIds" in steward) expect(steward.siteIds, s.id).toContain(s.id);
    }
  });
});
