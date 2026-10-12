// JSON-LD for a site page (docs/02 §7): a SportsActivityLocation with its position and region.
import { siteConfig } from "@/site.config";
import { absoluteUrl } from "./paths";
import { mainLaunch, sitePath } from "./sites";
import type { Site } from "./types";

export function siteJsonLd(site: Site, regionName: string): Record<string, unknown> {
  const launch = mainLaunch(site);
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: site.name,
    url: absoluteUrl(sitePath(site)),
    address: { "@type": "PostalAddress", addressRegion: regionName, addressCountry: site.country },
    ...(launch
      ? { geo: { "@type": "GeoCoordinates", latitude: launch.lat, longitude: launch.lon } }
      : {}),
    ...(site.officialGuideUrl ? { sameAs: [site.officialGuideUrl] } : {}),
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: siteConfig.name },
  };
}
