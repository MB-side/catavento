// Builds every generated data file from already-parsed inputs (docs/03 §6). Pure: the file
// reading and writing lives in scripts/build-data.ts, so the whole pipeline is testable.
import type {
  BuildReport,
  BuildWarning,
  Club,
  CollectedOrg,
  Country,
  EventItem,
  Notice,
  Offering,
  Organisation,
  Provider,
  Resource,
  Site,
  SiteStationEntry,
  Station,
  Brand,
  ProviderRun,
  GearCategory,
  StewardEvidence,
  StewardRole,
  CountryGuide,
  OverviewRegion,
  OverviewSite,
  TourOperator,
  VisitorHelp,
} from "@/lib/types";
import {
  applyOrgMerges,
  applyOverrides,
  applyRelated,
  applySiteStations,
  applySiteWind,
  type SiteWindInput,
  deriveClubs,
  mapOfferings,
  mapSampleSites,
  resolveAlias,
  resolveOrgRef,
  type MergeRule,
  type OfferingInput,
  type SampleSiteInput,
} from "./merge";
import { slugify } from "./ids";
import { assignOrgIds, mapDirectory, mapStations, type CsvRow } from "./seed";
import { OrgMatcher } from "./match";
import { mergeCollectedOrgs } from "./orgs";
import { dedupeEvents } from "./events";
import {
  confirmStewards,
  dedupeSites,
  enrichFromPge,
  matchListedContacts,
  placeCommunitySites,
} from "./sites";

export interface CountryInput extends Omit<Country, "nationalBody"> {
  nationalBody: Omit<Country["nationalBody"], "orgId"> & { orgLegacyId: string };
}

export interface BuildInputs {
  ingestedSites: Site[];
  ingestedOrgs: CollectedOrg[];
  ingestedEvents: EventItem[];
  ingestedNotices: Notice[];
  stewardEvidence: StewardEvidence[];
  runs: Record<string, ProviderRun>;
  directoryRows: CsvRow[];
  stationRows: CsvRow[];
  countries: CountryInput[];
  providers: Provider[];
  orgMerges: { merge: MergeRule[]; related: { ids: string[] }[] };
  overrides: Record<string, Record<string, unknown>>;
  clubAliases: Record<string, Record<string, string> | null>;
  siteStations: Record<string, SiteStationEntry[]>;
  siteStewards: Record<string, { org?: string; role: StewardRole }>;
  sampleSites: SampleSiteInput[];
  sampleSitesChecked: string;
  offerings: OfferingInput[];
  gearCategories: { org: string; sells: GearCategory[]; used?: boolean; source: string; checked: string }[];
  siteWind: SiteWindInput[];
  overview: OverviewRegion[];
  guides: CountryGuide[];
  ingestedOverviewSites: OverviewSite[];
  brands: {
    name: string;
    website?: string;
    distributors: { org: string; role: Brand["distributors"][number]["role"]; basis?: "brand" | "self"; source?: string; checked?: string }[];
    dealerPage?: Brand["dealerPage"];
  }[];
  visiting: {
    help: (Omit<VisitorHelp, "id" | "name" | "orgId"> & { name?: string; org?: string })[];
    tours: Omit<TourOperator, "id">[];
  };
}

export interface BuildOutputs {
  countries: Country[];
  providers: Provider[];
  organisations: (Organisation | Club)[];
  sites: Site[];
  stations: Station[];
  events: EventItem[];
  notices: Notice[];
  brands: Brand[];
  offerings: Offering[];
  resources: Resource[];
  overview: { regions: OverviewRegion[]; guides: CountryGuide[] };
  overviewSites: OverviewSite[];
  visiting: { help: VisitorHelp[]; tours: TourOperator[] };
  report: BuildReport;
}

const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id);

export function buildData(input: BuildInputs): BuildOutputs {
  const warnings: BuildWarning[] = [];
  const providerMap = new Map(input.providers.map((p) => [p.id, p]));

  // Organisations: seed rows → merged businesses → IDs → related links → manual overrides.
  const seed = mapDirectory(input.directoryRows, providerMap);
  warnings.push(...seed.warnings);
  const merged = applyOrgMerges(seed.orgs, input.orgMerges.merge, warnings);
  const seedOrgs = assignOrgIds(merged);
  applyRelated(seedOrgs, input.orgMerges.related, warnings);

  // Collected directories (SAFA) refresh matching records and add the ones the seed lacks.
  const matcher = new OrgMatcher(seedOrgs, input.clubAliases);
  const { organisations, associationNames } = mergeCollectedOrgs(
    input.ingestedOrgs,
    seedOrgs,
    matcher,
    warnings,
  );

  // Stations, with club owners matched only by exact alias.
  const { stations, warnings: stationWarnings } = mapStations(input.stationRows);
  warnings.push(...stationWarnings);
  const stationByLegacy = new Map(stations.map((s) => [s.legacyId, s]));
  for (const row of input.stationRows) {
    const station = stationByLegacy.get(row.station_id);
    if (!station) continue;
    const owner = resolveAlias(row.owner_or_admin, station.country, input.clubAliases, organisations);
    if (owner) {
      station.ownerOrgId = owner;
      if (organisations.find((o) => o.id === owner)?.kind === "club") station.ownerLabel = "club station";
    }
  }

  // Countries: national body named by legacy ID in countries.yaml.
  const countries: Country[] = input.countries.map(({ nationalBody: { orgLegacyId, ...body }, ...c }) => {
    const orgId = resolveOrgRef(orgLegacyId, organisations);
    if (!orgId) warnings.push({ code: "national-body-missing", message: `${c.code}: national body ${orgLegacyId} not found` });
    return { ...c, nationalBody: { ...body, orgId: orgId ?? orgLegacyId } };
  });

  // Sites: collected (Site Guide, later ParaglidingEarth) plus the hand-compiled NZ sample.
  const sampleSites = mapSampleSites(input.sampleSites, organisations, input.sampleSitesChecked, warnings);
  const collected = input.ingestedSites.map((s) => structuredClone(s));
  const pgeSites = collected.filter((s) => s.layer === "pge");
  input.sampleSites.forEach((sample, i) => {
    const site = sampleSites[i];
    if (site && sample.pgeIds?.length) enrichFromPge(site, sample.pgeIds, pgeSites, warnings);
  });
  // Countries whose ParaglidingEarth community sites are shown: full coverage, or opted in (D81).
  const fullCountries = new Set(
    input.countries.filter((c) => c.coverage === "full" || c.communitySites).map((c) => c.code),
  );
  const sites = dedupeSites(placeCommunitySites([...collected, ...sampleSites], fullCountries), warnings);
  matchListedContacts(sites, organisations, input.clubAliases, warnings);
  confirmStewards(sites, organisations, input.stewardEvidence, warnings);
  for (const [siteKey, steward] of Object.entries(input.siteStewards)) {
    const site = sites.find((s) => s.id === siteKey);
    if (!site) {
      warnings.push({ code: "steward-site-missing", message: `site-stewards.yaml: no site "${siteKey}"` });
      continue;
    }
    site.stewardRole = steward.role;
    site.stewardOrgId = steward.org ? resolveOrgRef(steward.org, organisations) : undefined;
  }
  applySiteStations(sites, input.siteStations, stations, warnings);
  applySiteWind(sites, organisations, input.siteWind, warnings);

  // What each shop sells, as it publishes (D73), with the page it came from as a source.
  for (const entry of input.gearCategories) {
    const org = organisations.find((o) => o.id === entry.org || o.legacyId === entry.org);
    if (!org) {
      warnings.push({ code: "gear-org-missing", message: `gear-categories.yaml: no organisation ${entry.org}` });
      continue;
    }
    org.sells = [...new Set([...(org.sells ?? []), ...entry.sells])];
    if (entry.used) org.sellsUsed = true;
    if (!org.sources.some((s) => s.url === entry.source)) {
      org.sources = [...org.sources, { providerId: "org-websites", url: entry.source, fetchedAt: entry.checked, licence: "facts" }];
    }
  }

  // Manual overrides win over everything else.
  const used = new Set<string>();
  for (const records of [organisations, stations, sites] as { id: string; legacyId?: string }[][]) {
    for (const key of applyOverrides(records, input.overrides)) used.add(key);
  }
  for (const key of Object.keys(input.overrides)) {
    if (!used.has(key)) warnings.push({ code: "override-unused", message: `overrides.yaml: no record matches "${key}"` });
  }

  const withClubs = deriveClubs(organisations, sites, stations);
  for (const club of withClubs) {
    const assoc = associationNames.get(club.id);
    if (club.kind !== "club" || !assoc) continue;
    const hit = matcher.find(assoc.country, assoc.name)?.org;
    if (hit?.kind === "regional_association") (club as Club).regionalAssociationId = hit.id;
    else {
      warnings.push({
        code: "association-unmatched",
        message: `${club.id}: association "${assoc.name}" matches no regional association`,
        recordId: club.id,
      });
    }
  }

  // Events and notices from sources, with organisers linked only on an exact match.
  // The national body's listing first, so its copy of an event is the one kept.
  const nationalFirst = [...input.ingestedEvents].sort(
    (a, b) => Number(a.sources[0]?.providerId === "club-websites") - Number(b.sources[0]?.providerId === "club-websites"),
  );
  const events = dedupeEvents(
    nationalFirst.map((e) => {
      if (e.organiserOrgId) return e;
      const organiser = e.organiserName ? matcher.find(e.country, e.organiserName)?.org : undefined;
      return organiser ? { ...e, organiserOrgId: organiser.id } : e;
    }),
    warnings,
  );
  const notices = [...input.ingestedNotices];
  const offerings = mapOfferings(input.offerings, withClubs, countries, providerMap, warnings);

  // Every country must exist in countries.yaml; every region code must belong to its country.
  const regionsByCountry = new Map(countries.map((c) => [c.code, new Set(c.regions)]));
  for (const r of [...withClubs, ...sites]) {
    const regions = regionsByCountry.get(r.country);
    if (!regions) warnings.push({ code: "unknown-country", message: `${r.id}: country ${r.country} not in countries.yaml`, recordId: r.id });
    else if (r.regionCode && !regions.has(r.regionCode)) {
      warnings.push({ code: "unknown-region", message: `${r.id}: region ${r.regionCode} not in countries.yaml`, recordId: r.id });
    }
  }

  // Duplicate IDs are an error, not a warning.
  for (const list of [withClubs, sites, stations] as { id: string }[][]) {
    const seen = new Set<string>();
    for (const r of list) {
      if (seen.has(r.id)) throw new Error(`Duplicate ID: ${r.id}`);
      seen.add(r.id);
    }
  }

  // Overview regions (D83): only countries listed in overview.yaml, sorted for stable output.
  const overviewCodes = new Set(input.overview.flatMap((r) => r.countries.map((c) => c.code)));
  const overviewSites = input.ingestedOverviewSites
    .filter((s) => overviewCodes.has(s.country))
    .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const guideCodes = new Set(["world", "europe", ...overviewCodes, ...input.countries.map((c) => c.code)]);
  for (const g of input.guides) {
    if (!guideCodes.has(g.code)) warnings.push({ code: "guide-unknown", message: `guides.yaml: "${g.code}" is not an overview region or country` });
  }

  // Visiting pilots (D89): listed businesses take their name and website from the directory, and
  // hidden ones drop out with them.
  const helpIds = new Set<string>();
  const visitorHelp: VisitorHelp[] = input.visiting.help.flatMap(({ org: ref, ...h }) => {
    const orgId = ref ? resolveOrgRef(ref, withClubs) : undefined;
    const org = orgId ? withClubs.find((o) => o.id === orgId) : undefined;
    if (ref && !org) {
      warnings.push({ code: "visiting-org-missing", message: `visiting.yaml: no organisation ${ref}` });
      return [];
    }
    if (org?.hidden) return [];
    const name = org?.name ?? h.name;
    if (!name) {
      warnings.push({ code: "visiting-name-missing", message: `visiting.yaml: an entry for ${h.country} has neither org nor name` });
      return [];
    }
    let id = `help:${h.country.toLowerCase()}:${slugify(name)}`;
    for (let n = 2; helpIds.has(id); n++) id = `help:${h.country.toLowerCase()}:${slugify(name)}-${n}`;
    helpIds.add(id);
    const website = org?.website ?? h.website;
    return [{ ...h, id, name, ...(website ? { website } : {}), ...(org ? { orgId: org.id } : {}) }];
  });
  const tourIds = new Set<string>();
  const tours: TourOperator[] = input.visiting.tours.map((t) => {
    let id = `tour:${slugify(t.name)}`;
    for (let n = 2; tourIds.has(id); n++) id = `tour:${slugify(t.name)}-${n}`;
    tourIds.add(id);
    return { ...t, id, destinations: [...new Set(t.destinations)].sort() };
  });

  const visible = withClubs.filter((o) => !o.hidden);
  const counts: Record<string, number> = {
    organisations: withClubs.length,
    clubs: visible.filter((o) => o.kind === "club").length,
    schools: visible.filter((o) => o.kind === "school").length,
    sites: sites.filter((s) => !s.hidden).length,
    stations: stations.filter((s) => !s.hidden).length,
    resources: seed.resources.length,
    providers: input.providers.length,
    offerings: offerings.length,
    events: events.length,
    notices: notices.length,
    overviewSites: overviewSites.length,
  };

  return {
    countries,
    providers: input.providers,
    organisations: withClubs.sort(byId),
    sites: sites.sort(byId),
    stations: stations.sort(byId),
    events: events.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id)),
    notices: notices.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)),
    brands: input.brands
      .map((b) => ({
        id: `brand:${slugify(b.name)}`,
        name: b.name,
        website: b.website,
        distributors: b.distributors.flatMap((d) => {
          const orgId = resolveOrgRef(d.org, withClubs);
          if (!orgId) warnings.push({ code: "brand-org-missing", message: `brands.yaml: ${b.name}: no organisation ${d.org}` });
          return orgId
            ? [{ orgId, role: d.role, basis: d.basis ?? "self", ...(d.source ? { source: d.source } : {}), ...(d.checked ? { checked: d.checked } : {}) }]
            : [];
        }),
        ...(b.dealerPage ? { dealerPage: b.dealerPage } : {}),
      }))
      .sort(byId),
    offerings,
    resources: seed.resources.sort(byId),
    overview: { regions: input.overview, guides: input.guides },
    overviewSites,
    visiting: {
      help: visitorHelp.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name)),
      tours: tours.sort((a, b) => a.name.localeCompare(b.name)),
    },
    report: { build: { counts, warnings }, providers: input.runs },
  };
}
