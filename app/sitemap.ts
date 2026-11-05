// sitemap.xml (docs/02 §7): every page, built at export time.
import type { MetadataRoute } from "next";
import { getEnabledCountries } from "@/lib/country";
import { getCountryProfiles } from "@/lib/country-profile";
import { getOverviewRegions, getSites } from "@/lib/data";
import { isGroup, worldPath } from "@/lib/overview";
import { absoluteUrl } from "@/lib/paths";
import { regionPath, sitePath } from "@/lib/sites";

export const dynamic = "force-static";

const GLOBAL = [
  "/",
  "/about",
  "/sources",
  "/status",
  "/bot",
  "/takedown",
  "/privacy",
  "/disclaimer",
  "/feedback",
  "/visiting",
  "/visiting/tours",
];
const SECTIONS = [
  "",
  "/sites",
  "/clubs",
  "/whats-on",
  "/gear",
  "/new-to-flying",
  "/visiting-pilots",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const urls = [...GLOBAL];
  for (const country of getEnabledCountries()) {
    const seg = `/${country.code.toLowerCase()}`;
    urls.push(...SECTIONS.map((s) => `${seg}${s}`));
    const sites = getSites(country.code);
    urls.push(...[...new Set(sites.map((s) => s.regionCode))].map(regionPath));
    urls.push(...sites.map(sitePath));
  }
  // Every other country has one page (D93); Europe keeps its map of the whole region.
  urls.push(
    ...getCountryProfiles()
      .filter((p) => !p.country)
      .map((p) => `/${p.code.toLowerCase()}`),
  );
  for (const region of getOverviewRegions().filter(isGroup)) urls.push(worldPath(region));
  return urls.map((u) => ({ url: absoluteUrl(u) }));
}
