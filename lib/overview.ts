// Overview regions (D83): paths, anchors and the compact records the maps load. Pure functions.
import type { SiteSummary } from "./site-summary";
import type { OverviewRegion, OverviewSite, WindArc } from "./types";

/** Europe and other groups have a light page per country; a destination is a single page. */
export const isGroup = (region: OverviewRegion): boolean => region.countries.length > 1;

export function worldPath(region?: OverviewRegion | string, country?: string): string {
  if (!region) return "/world";
  const slug = typeof region === "string" ? region : region.slug;
  return country ? `/world/${slug}/${country.toLowerCase()}` : `/world/${slug}`;
}

/** The list entry a map pin points at. */
export const siteAnchor = (s: Pick<OverviewSite, "id">): string => `site-${s.id.slice(4)}`;

/** Where a site is listed: its country's page in a group, or the destination's page. */
export function overviewSiteHref(region: OverviewRegion, s: OverviewSite): string {
  return `${worldPath(region, isGroup(region) ? s.country : undefined)}/#${siteAnchor(s)}`;
}

/** The region's map data file, written at build time. */
export const mapDataPath = (region: OverviewRegion | string): string =>
  `/data/world/${typeof region === "string" ? region : region.slug}.json`;

/** A site as the map file carries it: short keys keep Europe's file small. */
export interface MapSite {
  i: string; // id
  n: string; // name
  c: string; // country code
  a: number; // lat
  o: number; // lon
  w?: string; // wind label, when directions are rated good
  r?: WindArc[] | "all"; // good directions
  m?: WindArc[]; // directions rated possible
  h: string; // where it's listed
}

export function toMapSite(region: OverviewRegion, s: OverviewSite): MapSite {
  const parsed = s.windRanges === "all" || s.windRanges.length > 0;
  return {
    i: s.id,
    n: s.name,
    c: s.country,
    a: s.lat,
    o: s.lon,
    ...(parsed ? { w: s.windLabel, r: s.windRanges } : {}),
    ...(s.windMarginal?.length ? { m: s.windMarginal } : {}),
    h: overviewSiteHref(region, s),
  };
}

/** A ParaglidingEarth site's own page, from its ID ("pge:13095"). */
export const pgeSiteUrl = (id: string): string =>
  `https://www.paraglidingearth.com/?site=${id.replace(/^pge:/, "")}`;

export function mapSiteToSummary(m: MapSite, countryName: string): SiteSummary {
  return {
    id: m.i,
    name: m.n,
    href: m.h,
    ...(m.i.startsWith("pge:") ? { externalHref: pgeSiteUrl(m.i) } : {}),
    regionCode: m.c,
    regionName: countryName,
    status: "unknown",
    community: true,
    windRanges: m.r ?? [],
    windLabel: m.w ?? "",
    windParsed: !!m.w,
    disciplines: [],
    lat: m.a,
    lon: m.o,
    exact: true,
  };
}
