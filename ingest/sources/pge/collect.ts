// ParaglidingEarth (green tier, CC BY-SA 3.0): its open data service, one download per country,
// monthly. Facts only: name, takeoff position and height, wind directions rated good or possible,
// PG/HG, kinds of flying, landing and parking positions (D81). Never descriptions, rules, travel
// notes or comments: the detailed download includes them, and they are dropped here.
// In fully covered countries these become the "community data" layer for sites the primary guide
// lacks (duplicates are dropped at build, docs/05 §5.3); in sample countries they only supply
// coordinates and wind directions to sample sites pinned by ParaglidingEarth ID.
import type { Discipline, FlyingType, OverviewSite, Site, SitePoint, SourceRef } from "@/lib/types";
import { parseWindRange } from "@/lib/wind";
import { slugify, siteId } from "@/scripts/lib/data/ids";
import { sha256 } from "../../core/fetcher";
import type { CountryScope, ProviderModule } from "../../core/runner";
import type { RegionLookup } from "../../core/regions";

export const PGE_API = "https://www.paraglidingearth.com/api/geojson/getCountrySites.php";
export const READER_VERSION = 3;

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export interface PgeFeature {
  id?: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: Record<string, unknown> & {
    name: string;
    takeoff_altitude?: string;
    landing_lat?: string;
    landing_lng?: string;
    takeoff_parking_lat?: string;
    takeoff_parking_lng?: string;
    landing_parking_lat?: string;
    landing_parking_lng?: string;
    pge_site_id: string;
    pge_link?: string;
    paragliding?: string;
    hanggliding?: string;
    landing?: { landing_name?: string; landing_altitude?: string } | null;
  };
}

/** "Canberra, Lake George, Geary\\'s Gap" → "Canberra, Lake George, Geary's Gap"; drops a trailing "(NSW)". */
export function cleanPgeName(name: string, stateCodes: string[]): string {
  let out = name
    .replace(/\\(['"])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  const trailing = /\s*\(([A-Z]{2,3})\)$/.exec(out);
  if (trailing && stateCodes.includes(trailing[1] as string))
    out = out.slice(0, trailing.index).trim();
  return out;
}

/** Directions rated "good" (2): the site's wind range. */
export function goodDirections(p: PgeFeature["properties"]): string[] {
  return POINTS.filter((k) => p[k] === "2");
}

/** Directions rated "possible" (1): shown and judged as marginal, never as in range (D81). */
export function possibleDirections(p: PgeFeature["properties"]): string[] {
  return POINTS.filter((k) => p[k] === "1");
}

const FLYING: [string, FlyingType][] = [
  ["thermals", "thermal"],
  ["soaring", "soaring"],
  ["xc", "xc"],
  ["flatland", "flatland"],
  ["winch", "winch"],
];

/** A positive number from a ParaglidingEarth field ("" and "0" mean not given). */
function positive(v: string | undefined): number | undefined {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? n : undefined;
}

/** A position from two fields, or nothing if either is missing, zero or out of range. */
function position(
  lat: string | undefined,
  lon: string | undefined,
): { lat: number; lon: number } | undefined {
  const la = Number(lat);
  const lo = Number(lon);
  if (!lat || !lon || !Number.isFinite(la) || !Number.isFinite(lo)) return undefined;
  if ((la === 0 && lo === 0) || Math.abs(la) > 90 || Math.abs(lo) > 180) return undefined;
  return { lat: Number(la.toFixed(6)), lon: Number(lo.toFixed(6)) };
}

/** Kinds of flying, landings and parking: positions and short labels only. */
export function extraFacts(
  p: PgeFeature["properties"],
): Pick<Site, "flyingTypes" | "landings" | "parking"> {
  const flyingTypes = FLYING.filter(([k]) => p[k] === "1").map(([, t]) => t);
  const landingAt = position(p.landing_lat, p.landing_lng);
  const landingName = p.landing?.landing_name?.replace(/\s+/g, " ").trim().slice(0, 60);
  const landings: SitePoint[] = landingAt
    ? [
        {
          ...(landingName ? { name: landingName } : {}),
          ...landingAt,
          ...(positive(p.landing?.landing_altitude)
            ? { altitudeM: positive(p.landing?.landing_altitude) }
            : {}),
        },
      ]
    : [];
  const parking: SitePoint[] = [];
  const tp = position(p.takeoff_parking_lat, p.takeoff_parking_lng);
  if (tp) parking.push({ ...tp, serves: "takeoff" });
  const lp = position(p.landing_parking_lat, p.landing_parking_lng);
  if (lp) parking.push({ ...lp, serves: "landing" });
  return {
    ...(flyingTypes.length ? { flyingTypes } : {}),
    ...(landings.length ? { landings } : {}),
    ...(parking.length ? { parking } : {}),
  };
}

export function toSite(
  f: PgeFeature,
  country: CountryScope,
  regions: RegionLookup,
  source: Omit<SourceRef, "url">,
): { site?: Site; warning?: string } {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  if (f.geometry.type !== "Point" || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { warning: `ParaglidingEarth ${p.pge_site_id}: no usable position` };
  }
  const regionCode = regions.regionFor({ lat, lon }, country.regions);
  if (!regionCode)
    return { warning: `ParaglidingEarth ${p.pge_site_id} "${p.name}": no region for its position` };
  const stateCodes = [...country.regions].map((r) => r.split("-")[1] ?? "");
  const name = cleanPgeName(p.name, stateCodes);
  const slug = slugify(name) || `pge-${p.pge_site_id}`;
  const id = siteId(country.code, regionCode, slug);
  const dirs = goodDirections(p);
  const wind = dirs.length ? parseWindRange(dirs.join(", ")) : undefined;
  const possible = possibleDirections(p);
  const marginal = possible.length ? parseWindRange(possible.join(", ")).ranges : undefined;
  const altitudeM = positive(p.takeoff_altitude);
  const disciplines: Discipline[] = [];
  if (p.paragliding === "1") disciplines.push("PG");
  if (p.hanggliding === "1") disciplines.push("HG");
  const url =
    p.pge_link?.replace(/^http:/, "https:") ??
    `https://www.paraglidingearth.com/?site=${p.pge_site_id}`;
  return {
    site: {
      id,
      slug,
      name,
      country: country.code,
      regionCode,
      windRanges: wind?.ranges ?? [],
      windRangeLabel: wind?.label ?? "See official details",
      ...(marginal && marginal !== "all" && marginal.length ? { windMarginal: marginal } : {}),
      status: "unknown",
      stewardRole: "unknown",
      launches: [
        {
          id: `${id}:launch:1`,
          name: "Takeoff",
          lat: Number(lat.toFixed(6)),
          lon: Number(lon.toFixed(6)),
          precision: "exact",
          ...(altitudeM ? { altitudeM } : {}),
        },
      ],
      ...extraFacts(p),
      stationIds: [],
      disciplines,
      layer: "pge",
      pgeId: p.pge_site_id,
      sources: [{ ...source, url }],
    },
  };
}

/**
 * Community names shown as given, with two exceptions so they meet the site's wording rules
 * (docs/07): square brackets become round ones ("[closed]" → "(closed)"), and "safe" becomes
 * "suitable" ("No Safe Local LZ" → "No Suitable Local LZ"), which keeps the warning.
 */
export function overviewName(raw: string): string {
  return cleanPgeName(raw, [])
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/\bsafe\b/gi, (w) => (w[0] === "S" ? "Suitable" : "suitable"));
}

/**
 * A light record for an overview-region country (D83): position, height, wind directions, kinds of
 * flying and the landing position, linking to its ParaglidingEarth page. No region lookup: the
 * country is the one asked for.
 */
export function toOverviewSite(
  f: PgeFeature,
  country: string,
  fetchedAt: string,
): OverviewSite | undefined {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  if (f.geometry.type !== "Point" || !Number.isFinite(lat) || !Number.isFinite(lon))
    return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) return undefined;
  if (!/^\d+$/.test(p.pge_site_id ?? "")) return undefined;
  const name = overviewName(p.name);
  if (!name) return undefined;
  const dirs = goodDirections(p);
  const wind = dirs.length ? parseWindRange(dirs.join(", ")) : undefined;
  const possible = possibleDirections(p);
  const marginal = possible.length ? parseWindRange(possible.join(", ")).ranges : undefined;
  const disciplines: Discipline[] = [];
  if (p.paragliding === "1") disciplines.push("PG");
  if (p.hanggliding === "1") disciplines.push("HG");
  const extra = extraFacts(p);
  const altitudeM = positive(p.takeoff_altitude);
  const landing = extra.landings?.[0];
  return {
    id: `pge:${p.pge_site_id}`,
    name,
    country: country.toUpperCase(),
    lat: Number(lat.toFixed(5)),
    lon: Number(lon.toFixed(5)),
    ...(altitudeM ? { altitudeM } : {}),
    windRanges: wind?.ranges ?? [],
    ...(marginal && marginal !== "all" && marginal.length ? { windMarginal: marginal } : {}),
    windLabel: wind?.label ?? "See official details",
    disciplines,
    ...(extra.flyingTypes ? { flyingTypes: extra.flyingTypes } : {}),
    ...(landing ? { landing: { lat: landing.lat, lon: landing.lon } } : {}),
    url:
      p.pge_link?.replace(/^http:/, "https:") ??
      `https://www.paraglidingearth.com/?site=${p.pge_site_id}`,
    fetchedAt,
  };
}

export const pge: ProviderModule = {
  id: "pge",
  async collect(ctx) {
    const downloads = [];
    for (const country of ctx.countries) {
      // "detailled" (sic) adds the landing's name and height; its text fields are never kept.
      const res = await ctx.fetcher.get(
        `${PGE_API}?iso=${country.code.toLowerCase()}&style=detailled`,
      );
      downloads.push({ country, res });
    }
    // Overview-region countries (D83): the plain download is enough for their light records.
    const fullCodes = new Set(ctx.countries.map((c) => c.code));
    const overviewDownloads = [];
    for (const code of ctx.overview ?? []) {
      if (fullCodes.has(code)) continue;
      const res = await ctx.fetcher.get(`${PGE_API}?iso=${code.toLowerCase()}`);
      overviewDownloads.push({ code, res });
    }
    const contentHash = sha256(
      `${READER_VERSION}:${[...downloads, ...overviewDownloads].map((d) => d.res.contentHash).join(":")}`,
    );
    if (!ctx.force && contentHash === ctx.previous?.contentHash) {
      return { unchanged: true, contentHash, records: {}, invalid: 0, warnings: [] };
    }
    const sites: Site[] = [];
    const warnings: string[] = [];
    let invalid = 0;
    for (const { country, res } of downloads) {
      const features = (JSON.parse(res.body) as { features?: PgeFeature[] }).features ?? [];
      const source = {
        providerId: "pge",
        fetchedAt: res.fetchedAt,
        licence: "cc-by-sa-3.0" as const,
        contentHash,
      };
      const used = new Set<string>();
      for (const f of features) {
        const { site, warning } = toSite(f, country, ctx.regions, source);
        if (warning) warnings.push(warning);
        if (!site) {
          invalid++;
          continue;
        }
        // Two takeoffs with the same name in one region: the later one gets its ParaglidingEarth ID.
        if (used.has(site.id)) {
          const slug = `${site.slug}-${site.pgeId}`;
          const id = siteId(country.code, site.regionCode, slug);
          Object.assign(site, {
            id,
            slug,
            launches: site.launches.map((l) => ({ ...l, id: `${id}:launch:1` })),
          });
        }
        used.add(site.id);
        sites.push(site);
      }
    }
    const overviewSites: OverviewSite[] = [];
    for (const { code, res } of overviewDownloads) {
      const features = (JSON.parse(res.body) as { features?: PgeFeature[] }).features ?? [];
      for (const f of features) {
        const site = toOverviewSite(f, code, res.fetchedAt);
        if (site) overviewSites.push(site);
        else invalid++;
      }
    }
    return {
      unchanged: false,
      contentHash,
      records: { sites, ...(overviewSites.length ? { overviewSites } : {}) },
      invalid,
      warnings,
    };
  },
};
