// The small, client-safe description of a site used by the list, filters and map.
import { mainLaunch, sitePath } from "./sites";
import type { Discipline, Site, WindArc } from "./types";

export interface SiteSummary {
  id: string;
  name: string;
  href: string;
  regionCode: string;
  regionName: string;
  status: Site["status"];
  community: boolean;
  windRanges: WindArc[] | "all";
  windLabel: string;
  windParsed: boolean;
  disciplines: Discipline[];
  steward?: string; // "Managed by …" when confirmed
  contact?: string; // the listed contact otherwise
  lat?: number;
  lon?: number;
}

export function summarise(
  site: Site,
  regionName: string,
  names: { steward?: string; contact?: string },
): SiteSummary {
  const launch = mainLaunch(site);
  return {
    id: site.id,
    name: site.name,
    href: sitePath(site),
    regionCode: site.regionCode,
    regionName,
    status: site.status,
    community: site.layer === "pge",
    windRanges: site.windRanges,
    windLabel: site.windRangeLabel,
    windParsed: site.windRanges === "all" || site.windRanges.length > 0,
    disciplines: site.disciplines,
    steward: names.steward,
    contact: names.steward ? undefined : names.contact,
    lat: launch?.lat,
    lon: launch?.lon,
  };
}
