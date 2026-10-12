// The ONLY module that reads data files (docs/03 §3). Pages and components ask for records here;
// in Iteration 2 the same functions read from the database instead (docs/03 §9).
// Server-side only: runs at build time against data/generated/*.json.
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  anyOrganisationSchema,
  brandSchema,
  buildReportSchema,
  countrySchema,
  eventSchema,
  noticeSchema,
  offeringSchema,
  providerSchema,
  resourceSchema,
  siteSchema,
  stationSchema,
} from "@/lib/schemas";
import type {
  Brand,
  BuildReport,
  Club,
  Country,
  CountryCode,
  EventItem,
  Notice,
  Offering,
  OrgKind,
  Organisation,
  Provider,
  Resource,
  Site,
  Station,
} from "@/lib/types";

const GENERATED = path.join(process.cwd(), "data", "generated");
const cache = new Map<string, unknown>();

function load<T>(file: string, schema: z.ZodType<T>): T {
  if (!cache.has(file)) {
    const raw: unknown = JSON.parse(readFileSync(path.join(GENERATED, file), "utf8"));
    cache.set(file, schema.parse(raw));
  }
  return cache.get(file) as T;
}

/** Test hook: forget loaded files. */
export function clearDataCache(): void {
  cache.clear();
}

const sameCountry = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();

// ---------- countries and providers ----------

export function getCountries(): Country[] {
  return load("countries.json", z.array(countrySchema));
}

export function getProviders(): Provider[] {
  return load("providers.json", z.array(providerSchema));
}

export function getProvider(id: string): Provider | undefined {
  return getProviders().find((p) => p.id === id);
}

// ---------- organisations ----------

export function getOrganisations(filter: { country?: CountryCode; kind?: OrgKind } = {}): Organisation[] {
  return load("organisations.json", z.array(anyOrganisationSchema)).filter(
    (o) =>
      !o.hidden &&
      (!filter.country || sameCountry(o.country, filter.country)) &&
      (!filter.kind || o.kind === filter.kind || o.additionalKinds?.includes(filter.kind)),
  );
}

export function getOrganisation(id: string): Organisation | undefined {
  return getOrganisations().find((o) => o.id === id);
}

export function getClubs(country?: CountryCode): Club[] {
  return getOrganisations({ country, kind: "club" }).filter((o): o is Club => o.kind === "club");
}

// ---------- sites and stations ----------

export function getSites(country?: CountryCode): Site[] {
  return load("sites.json", z.array(siteSchema)).filter(
    (s) => !s.hidden && (!country || sameCountry(s.country, country)),
  );
}

export function getSite(id: string): Site | undefined {
  return getSites().find((s) => s.id === id);
}

/** Sites in one region (state, territory or NZ region), by name. */
export function getSitesInRegion(regionCode: string): Site[] {
  return getSites()
    .filter((s) => s.regionCode === regionCode)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getStations(): Station[] {
  return load("stations.json", z.array(stationSchema)).filter((s) => !s.hidden);
}

export function getStation(id: string): Station | undefined {
  return getStations().find((s) => s.id === id);
}

// ---------- events and notices ----------

export function getEvents(country?: CountryCode): EventItem[] {
  return load("events.json", z.array(eventSchema)).filter(
    (e) => !country || sameCountry(e.country, country),
  );
}

export function getNotices(filter: { country?: CountryCode; orgId?: string } = {}): Notice[] {
  return load("notices.json", z.array(noticeSchema)).filter(
    (n) =>
      (!filter.country || sameCountry(n.country, filter.country)) &&
      (!filter.orgId || n.orgId === filter.orgId),
  );
}

// ---------- everything else ----------

export function getOfferings(orgId?: string): Offering[] {
  return load("offerings.json", z.array(offeringSchema)).filter((o) => !orgId || o.orgId === orgId);
}

export function getBrands(): Brand[] {
  return load("brands.json", z.array(brandSchema));
}

export function getResources(): Resource[] {
  return load("resources.json", z.array(resourceSchema));
}

export function getBuildReport(): BuildReport {
  return load("_report.json", buildReportSchema);
}

export interface CountryCounts {
  sites: number;
  clubs: number;
  schools: number;
  tandemOperators: number;
  gear: number;
  stations: number;
}

/** Live counts for overview pages; worked out from the data, never typed in. */
export function getCounts(country: CountryCode): CountryCounts {
  const orgs = getOrganisations({ country });
  const has = (o: Organisation, kinds: OrgKind[]) =>
    kinds.includes(o.kind) || (o.additionalKinds ?? []).some((k) => kinds.includes(k));
  return {
    sites: getSites(country).length,
    clubs: orgs.filter((o) => o.kind === "club").length,
    schools: orgs.filter((o) => has(o, ["school"])).length,
    tandemOperators: orgs.filter((o) => has(o, ["tandem_operator"])).length,
    gear: orgs.filter((o) =>
      has(o, ["retailer", "importer_distributor", "manufacturer", "service_centre"]),
    ).length,
    stations: getStations().filter((s) => sameCountry(s.country, country)).length,
  };
}
