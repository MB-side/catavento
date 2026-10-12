// Turns parsed Site Guide sites into Catavento Site records (docs/04 §2). Region comes from the
// first launch's position; the Site Guide's "Contact/Responsible" becomes a listed contact, not a
// steward: a club is shown as managing a site only when a second source agrees (D47).
import type { Discipline, Site, SourceRef } from "@/lib/types";
import { parseWindRange } from "@/lib/wind";
import type { RegionLookup } from "../../core/regions";
import { orgSlug, siteId } from "@/scripts/lib/data/ids";
import type { ParsedSite } from "./parse";

export interface NormaliseContext {
  country: string;
  allowedRegions: ReadonlySet<string>;
  regions: RegionLookup;
  fetchedAt: string;
  contentHash: string;
}

export function disciplinesFromRating(rating: string | undefined): Discipline[] {
  const out: Discipline[] = [];
  if (/\bPG|paraglid/i.test(rating ?? "")) out.push("PG");
  if (/\bHG|hang/i.test(rating ?? "")) out.push("HG");
  return out;
}

export function normaliseSites(
  parsed: ParsedSite[],
  ctx: NormaliseContext,
): { sites: Site[]; warnings: string[]; invalid: number } {
  const sites: Site[] = [];
  const warnings: string[] = [];
  const used = new Set<string>();
  let invalid = 0;

  for (const p of parsed) {
    const first = p.launches[0];
    const regionCode = first ? ctx.regions.regionFor(first, ctx.allowedRegions) : undefined;
    if (!first || !regionCode) {
      invalid++;
      warnings.push(`${p.name}: no region found for its launch position; skipped`);
      continue;
    }
    let slug = orgSlug(p.name, true);
    let id = siteId(ctx.country, regionCode, slug);
    for (let n = 2; used.has(id); n++) {
      slug = `${orgSlug(p.name, true)}-${n}`;
      id = siteId(ctx.country, regionCode, slug);
      warnings.push(`${p.name}: name used twice in ${regionCode}; given ID ${id}`);
    }
    used.add(id);

    const wind = parseWindRange(p.conditionsText);
    if (!wind.parsed)
      warnings.push(`${p.name}: wind directions not readable ("${p.conditionsText ?? "none"}")`);

    const source: SourceRef = {
      providerId: "ansg",
      url: p.siteGuideUrl,
      fetchedAt: ctx.fetchedAt,
      licence: "facts",
      contentHash: ctx.contentHash,
    };

    sites.push({
      id,
      slug,
      name: p.name,
      country: ctx.country,
      regionCode,
      siteGuideUrl: p.siteGuideUrl,
      officialGuideUrl: p.siteGuideUrl,
      typeText: p.typeText,
      heightText: p.heightText,
      ratingText: p.ratingText,
      conditionsText: p.conditionsText,
      windRanges: wind.ranges,
      windRangeLabel: wind.label,
      status: p.status,
      stewardRole: "unknown",
      listedContact: p.contact
        ? { name: p.contact.name, url: p.contact.url, providerId: "ansg" }
        : undefined,
      launches: p.launches.map((l, i) => ({
        id: `${id}:launch:${i + 1}`,
        name: l.name,
        lat: Number(l.lat.toFixed(6)),
        lon: Number(l.lon.toFixed(6)),
        precision: "exact",
      })),
      stationIds: [],
      disciplines: disciplinesFromRating(p.ratingText),
      layer: "ansg",
      sources: [source],
    });
  }
  return { sites, warnings, invalid };
}
