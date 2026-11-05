// Client-safe country helpers: work from URL segments and siteConfig only (no file access).
import { siteConfig } from "@/site.config";

/** Lowercase URL segments of the enabled countries, e.g. ["au", "nz"]. */
export const countrySegments: readonly string[] = siteConfig.enabledCountries.map((c) =>
  c.toLowerCase(),
);

export const defaultCountrySegment = siteConfig.defaultCountry.toLowerCase();

/**
 * The country segment a path belongs to, or undefined for global pages. Every country has a page at
 * /<two-letter code>/ (D93); no global page has a two-letter name.
 * Accepts paths with or without the basePath already removed (as usePathname returns them).
 */
export function countryFromPath(pathname: string): string | undefined {
  const parts = pathname.split("/").filter((part) => part !== "");
  const first = parts[0] === siteConfig.basePath.replace(/^\//, "") ? parts[1] : parts[0];
  return first !== undefined && /^[a-z]{2}$/.test(first) ? first : undefined;
}

/** Whether a country has the full set of sections (Australia, New Zealand) or a single page. */
export const hasSections = (segment: string): boolean => countrySegments.includes(segment);

/** Where the visitor's last country is remembered, on their own device only. */
export const COUNTRY_KEY = "catavento.country";
