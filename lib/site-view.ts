// Everything a site page shows, gathered from lib/data (the only reader) at build time.
import "server-only";
import {
  getEvents,
  getNotices,
  getOrganisation,
  getOrganisations,
  getProvider,
  getSites,
  getStations,
} from "@/lib/data";
import { distanceKm } from "@/lib/geo";
import { clubPath } from "@/lib/clubs";
import { summarise, type SiteSummary } from "@/lib/site-summary";
import { mainLaunch } from "@/lib/sites";
import type {
  Country,
  EventItem,
  Notice,
  Organisation,
  Provider,
  Site,
  Station,
} from "@/lib/types";

export const ON_SITE_KM = 0.2;
export const NEARBY_STATION_KM = 2;

export interface StationLink {
  station: Station;
  provider?: Provider;
  km?: number; // distance from the main launch, when both positions are known
}

/**
 * Stations for a site (docs/05 §5.5): curated ones first (site-stations.yaml), then stations with
 * a known position on site (≤ 200 m) or nearby (≤ 2 km). Hidden stations are never shown.
 */
export function stationsFor(site: Site): StationLink[] {
  const all = getStations();
  const launch = mainLaunch(site);
  const dist = (s: Station) =>
    launch && s.lat !== undefined && s.lon !== undefined
      ? distanceKm(launch, { lat: s.lat, lon: s.lon })
      : undefined;
  const curated = site.stationIds
    .map((id) => all.find((s) => s.id === id))
    .filter((s): s is Station => !!s && !!s.url);
  const near = all
    .filter((s) => s.country === site.country && s.url && !curated.includes(s))
    .map((s) => ({ s, km: dist(s) }))
    .filter((x): x is { s: Station; km: number } => x.km !== undefined && x.km <= NEARBY_STATION_KM)
    .sort((a, b) => a.km - b.km)
    .map((x) => x.s);
  return [...curated, ...near].map((station) => ({
    station,
    provider: getProvider(station.providerId),
    km: dist(station),
  }));
}

export interface SiteView {
  steward?: Organisation;
  listed?: Organisation;
  also: { org: Organisation; note?: string }[];
  stations: StationLink[];
  notices: Notice[];
  schools: Organisation[];
  events: EventItem[];
  otherSites: Site[];
}

const NOTICE_LIMIT = 5;
const EVENT_LIMIT = 5;

export function siteView(site: Site, today: string): SiteView {
  const steward = site.stewardOrgId ? getOrganisation(site.stewardOrgId) : undefined;
  const listed = site.listedContact?.orgId ? getOrganisation(site.listedContact.orgId) : undefined;
  const newsOrg = steward ?? listed;
  const also = (site.alsoAdministeredBy ?? []).flatMap((a) => {
    const org = getOrganisation(a.orgId);
    return org ? [{ org, note: a.note }] : [];
  });
  const schools = getOrganisations({ country: site.country })
    .filter(
      (o) =>
        o.regionCode === site.regionCode &&
        (o.kind === "school" ||
          o.kind === "tandem_operator" ||
          o.additionalKinds?.some((k) => k === "school" || k === "tandem_operator")),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const events = getEvents(site.country)
    .filter(
      (e) => e.regionCode === site.regionCode && (e.endDate ?? e.startDate).slice(0, 10) >= today,
    )
    .slice(0, EVENT_LIMIT);
  const notices = newsOrg
    ? getNotices({ orgId: newsOrg.id })
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, NOTICE_LIMIT)
    : [];
  const otherSites = steward
    ? getSites(site.country)
        .filter((s) => s.id !== site.id && s.stewardOrgId === steward.id)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  return {
    steward,
    listed,
    also,
    stations: stationsFor(site),
    notices,
    schools,
    events,
    otherSites,
  };
}

/** Summaries for the sites list and map, with steward or listed-contact names filled in. */
export function siteSummaries(country: Country, regionCode?: string): SiteSummary[] {
  const org = (id?: string) => (id ? getOrganisation(id) : undefined);
  const page = (o?: Organisation) =>
    o && (o.kind === "club" || o.kind === "regional_association") ? clubPath(o) : undefined;
  return getSites(country.code)
    .filter((s) => !regionCode || s.regionCode === regionCode)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) =>
      summarise(s, country.regionNames[s.regionCode] ?? s.regionCode, {
        steward: org(s.stewardOrgId)?.name,
        stewardHref: page(org(s.stewardOrgId)),
        contact: org(s.listedContact?.orgId)?.name ?? s.listedContact?.name,
        contactHref: page(org(s.listedContact?.orgId)),
      }),
    );
}
