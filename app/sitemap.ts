// sitemap.xml (docs/02 §7): every page, built at export time.
import type { MetadataRoute } from "next";
import { getEnabledCountries } from "@/lib/country";
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
  urls.push(worldPath());
  for (const region of getOverviewRegions()) {
    urls.push(worldPath(region));
    if (isGroup(region)) urls.push(...region.countries.map((c) => worldPath(region, c.code)));
  }
  return urls.map((u) => ({ url: absoluteUrl(u) }));
}
