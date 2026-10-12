// Australian National Site Guide: two downloads (open and closed sites), parsed for short facts.
import { strFromU8, unzipSync } from "fflate";
import { sha256, type FetchResult } from "../../core/fetcher";
import type { ProviderModule } from "../../core/runner";
import { normaliseSites } from "./normalise";
import { parseSiteGuideKml } from "./parse";

export const SITE_GUIDE_FILES = {
  open: "https://siteguide.org.au/Kml/Open",
  closed: "https://siteguide.org.au/Kml/Closed",
} as const;

/** The Site Guide serves zipped Google Earth files (.kmz) under a KML content type: unzip if needed. */
export function kmlText(file: Pick<FetchResult, "bytes">): string {
  const b = file.bytes;
  if (b[0] === 0x50 && b[1] === 0x4b) {
    const entries = unzipSync(b);
    const name = Object.keys(entries).find((n) => n.toLowerCase().endsWith(".kml"));
    if (!name) throw new Error("Zipped Site Guide file has no .kml inside");
    return strFromU8(entries[name] as Uint8Array);
  }
  return new TextDecoder().decode(b);
}

export const ansg: ProviderModule = {
  id: "ansg",
  async collect(ctx) {
    const open = await ctx.fetcher.get(SITE_GUIDE_FILES.open);
    const closed = await ctx.fetcher.get(SITE_GUIDE_FILES.closed);
    const contentHash = sha256(open.contentHash + closed.contentHash);
    if (!ctx.force && contentHash === ctx.previous?.contentHash) {
      return { unchanged: true, contentHash, records: {}, invalid: 0, warnings: [] };
    }

    const a = parseSiteGuideKml(kmlText(open), "open");
    const b = parseSiteGuideKml(kmlText(closed), "closed");
    const openUrls = new Set(a.sites.map((s) => s.siteGuideUrl));
    // A site in both files is treated as closed only if it isn't also listed as open.
    const parsed = [...a.sites, ...b.sites.filter((s) => !openUrls.has(s.siteGuideUrl))];
    const country = ctx.countries[0];
    if (ctx.countries.length !== 1 || !country)
      throw new Error("The Site Guide covers one country");
    const { sites, warnings, invalid } = normaliseSites(parsed, {
      country: country.code,
      allowedRegions: country.regions,
      regions: ctx.regions,
      fetchedAt: open.fetchedAt,
      contentHash,
    });
    for (const name of [...a.skipped, ...b.skipped])
      warnings.push(`${name}: launch without a site link; skipped`);
    return {
      unchanged: false,
      contentHash,
      records: { sites },
      invalid: invalid + a.skipped.length + b.skipped.length,
      warnings,
    };
  },
};
