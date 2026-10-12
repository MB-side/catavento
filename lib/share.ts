// Where each site's share image lives (written after the build by scripts/share-images.tsx).
import { regionSegmentOf } from "./sites";
import type { Site } from "./types";

/** "/og/sites/au/nsw/long-reef-ne.png" */
export function siteShareImagePath(site: Pick<Site, "country" | "regionCode" | "slug">): string {
  return `/og/sites/${site.country.toLowerCase()}/${regionSegmentOf(site.regionCode)}/${site.slug}.png`;
}
