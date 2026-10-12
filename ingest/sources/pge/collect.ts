// ParaglidingEarth (green tier, CC BY-SA 3.0): its open data service, one download per country,
// monthly. Facts only: name, takeoff position, good wind directions, PG/HG. Never descriptions.
// In fully covered countries these become the "community data" layer for sites the primary guide
// lacks (duplicates are dropped at build, docs/05 §5.3); in sample countries they only supply
// coordinates and wind directions to sample sites pinned by ParaglidingEarth ID.
import type { Discipline, Site, SourceRef } from "@/lib/types";
import { parseWindRange } from "@/lib/wind";
import { slugify, siteId } from "@/scripts/lib/data/ids";
import { sha256 } from "../../core/fetcher";
import type { CountryScope, ProviderModule } from "../../core/runner";
import type { RegionLookup } from "../../core/regions";

export const PGE_API = "https://www.paraglidingearth.com/api/geojson/getCountrySites.php";
export const READER_VERSION = 1;

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export interface PgeFeature {
  id?: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: Record<string, string | undefined> & {
    name: string;
    pge_site_id: string;
    pge_link?: string;
    paragliding?: string;
    hanggliding?: string;
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

/** Directions rated "good" (2). "Possible" (1) is left out, so nothing is overstated. */
export function goodDirections(p: PgeFeature["properties"]): string[] {
  return POINTS.filter((k) => p[k] === "2");
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
      status: "unknown",
      stewardRole: "unknown",
      launches: [
        {
          id: `${id}:launch:1`,
          name: "Takeoff",
          lat: Number(lat.toFixed(6)),
          lon: Number(lon.toFixed(6)),
          precision: "exact",
        },
      ],
      stationIds: [],
      disciplines,
      layer: "pge",
      pgeId: p.pge_site_id,
      sources: [{ ...source, url }],
    },
  };
}

export const pge: ProviderModule = {
  id: "pge",
  async collect(ctx) {
    const downloads = [];
    for (const country of ctx.countries) {
      const res = await ctx.fetcher.get(`${PGE_API}?iso=${country.code.toLowerCase()}`);
      downloads.push({ country, res });
    }
    const contentHash = sha256(
      `${READER_VERSION}:${downloads.map((d) => d.res.contentHash).join(":")}`,
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
    return { unchanged: false, contentHash, records: { sites }, invalid, warnings };
  },
};
