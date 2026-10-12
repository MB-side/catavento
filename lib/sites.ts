// Site helpers shared by pages and client components (no data reading here: that's lib/data).
import type { Site, StewardRole } from "./types";

/** "AU-NSW" → "nsw": the URL segment for a region (the same rule as site IDs, docs/04 §1). */
export function regionSegmentOf(regionCode: string): string {
  return regionCode.split("-")[1]?.toLowerCase() ?? regionCode.toLowerCase();
}

/** "/au/sites/nsw/long-reef-ne" for a site; next/link adds basePath and the trailing slash. */
export function sitePath(site: Pick<Site, "country" | "regionCode" | "slug">): string {
  return `/${site.country.toLowerCase()}/sites/${regionSegmentOf(site.regionCode)}/${site.slug}`;
}

/** "/au/sites/nsw" for a region. */
export function regionPath(regionCode: string): string {
  const [country = ""] = regionCode.split("-");
  return `/${country.toLowerCase()}/sites/${regionSegmentOf(regionCode)}`;
}

/** Which label the steward panel uses (docs/06 §6). A listed contact alone is not a steward (D47). */
export type StewardLabel =
  | "managedBy"
  | "operatedBy"
  | "siteHolder"
  | "accessManagedBy"
  | "openSite"
  | "listedContact"
  | "notListed";

export function stewardLabel(
  site: Pick<Site, "stewardRole" | "stewardOrgId" | "listedContact">,
): StewardLabel {
  const role: StewardRole = site.stewardRole;
  if (role === "club" || role === "national_body") return "managedBy";
  if (role === "flight_park" || role === "operator") return "operatedBy";
  if (role === "site_holder") return "siteHolder";
  if (role === "landowner" || role === "municipality") return "accessManagedBy";
  if (role === "none") return "openSite";
  return site.listedContact ? "listedContact" : "notListed";
}

/** The first launch with an exact position: the one shown on maps and used for distances. */
export function mainLaunch(site: Pick<Site, "launches">) {
  return site.launches.find(
    (l) => l.precision === "exact" && l.lat !== undefined && l.lon !== undefined,
  ) as (Site["launches"][number] & { lat: number; lon: number }) | undefined;
}
