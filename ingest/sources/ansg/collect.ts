// Australian National Site Guide (amber tier, permission granted, D59): its export service,
// checked daily with the version tag it sends, so an unchanged day costs one tiny reply.
import { sha256 } from "../../core/fetcher";
import type { ProviderModule } from "../../core/runner";
import { parseExport, SITE_GUIDE_BASE, type SiteGuideExport } from "./export";
import { normaliseSites } from "./normalise";

/** Bump when parsing or normalising changes, so the next run re-reads the export. */
export const READER_VERSION = 4;

export const SITE_GUIDE_EXPORT = `${SITE_GUIDE_BASE}/api/Export`;

export const ansg: ProviderModule = {
  id: "ansg",
  async collect(ctx) {
    const country = ctx.countries[0];
    if (ctx.countries.length !== 1 || !country)
      throw new Error("The Site Guide covers one country");

    // Ask "has it changed?" only if the last copy was read by this version of the reader.
    const [lastReader, lastTag] = (ctx.previous?.sourceVersion ?? "").split("|");
    const ifNoneMatch =
      !ctx.force && lastReader === String(READER_VERSION) && lastTag ? lastTag : undefined;
    const res = await ctx.fetcher.get(SITE_GUIDE_EXPORT, { ifNoneMatch });
    if (res.notModified) {
      return {
        unchanged: true,
        contentHash: ctx.previous?.contentHash ?? "",
        records: {},
        invalid: 0,
        warnings: [],
        sourceVersion: ctx.previous?.sourceVersion,
      };
    }

    const contentHash = sha256(`${READER_VERSION}:${res.etag ?? res.contentHash}`);
    const { sites: parsed, skipped } = parseExport(JSON.parse(res.body) as SiteGuideExport);
    const { sites, warnings, invalid } = normaliseSites(parsed, {
      country: country.code,
      allowedRegions: country.regions,
      regions: ctx.regions,
      fetchedAt: res.fetchedAt,
      contentHash,
    });
    for (const name of skipped) warnings.push(`${name}: no launch position; skipped`);
    return {
      unchanged: false,
      contentHash,
      records: { sites },
      invalid: invalid + skipped.length,
      warnings,
      sourceVersion: res.etag ? `${READER_VERSION}|${res.etag}` : undefined,
    };
  },
};
