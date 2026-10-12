// sitemap.xml (docs/02 §7): every page, built at export time.
import type { MetadataRoute } from "next";
import { getEnabledCountries } from "@/lib/country";
import { getSites } from "@/lib/data";
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
  return urls.map((u) => ({ url: absoluteUrl(u) }));
}
