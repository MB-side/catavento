// The small, client-safe description of a site used by the list, filters and map.
import { mainLaunch, sitePath } from "./sites";
import type { Discipline, Site, WindArc } from "./types";

export interface SiteSummary {
  id: string;
  name: string;
  href: string;
  /** The source's own page for the site, opened in a new tab from the map (D90). */
  externalHref?: string;
  regionCode: string;
  regionName: string;
  status: Site["status"];
  community: boolean;
  windRanges: WindArc[] | "all";
  windMarginal?: WindArc[];
  windLabel: string;
  windParsed: boolean;
  disciplines: Discipline[];
  steward?: string; // "Managed by …" when confirmed
  stewardHref?: string; // its club page
  contact?: string; // the listed contact otherwise
  contactHref?: string;
  lat?: number;
  lon?: number;
  exact: boolean; // the main launch has an exact position (outlook only then, docs/04 §5)
  stations?: { name: string; url: string }[];
  wtfSlug?: string;
}

export function summarise(
  site: Site,
  regionName: string,
  names: { steward?: string; stewardHref?: string; contact?: string; contactHref?: string },
  stations: { name: string; url: string }[] = [],
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
    ...(site.windMarginal?.length ? { windMarginal: site.windMarginal } : {}),
    windLabel: site.windRangeLabel,
    windParsed: site.windRanges === "all" || site.windRanges.length > 0,
    disciplines: site.disciplines,
    steward: names.steward,
    stewardHref: names.steward ? names.stewardHref : undefined,
    contact: names.steward ? undefined : names.contact,
    contactHref: names.steward ? undefined : names.contactHref,
    lat: launch?.lat,
    lon: launch?.lon,
    exact: !!launch,
    stations: stations.length ? stations : undefined,
    wtfSlug: site.wtfSlug,
  };
}
