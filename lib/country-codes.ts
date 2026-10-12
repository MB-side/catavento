// Client-safe country helpers: work from URL segments and siteConfig only (no file access).
import { siteConfig } from "@/site.config";

/** Lowercase URL segments of the enabled countries, e.g. ["au", "nz"]. */
export const countrySegments: readonly string[] = siteConfig.enabledCountries.map((c) =>
  c.toLowerCase(),
);

export const defaultCountrySegment = siteConfig.defaultCountry.toLowerCase();

/**
 * The country segment a path belongs to, or undefined for global pages.
 * Accepts paths with or without the basePath already removed (as usePathname returns them).
 */
export function countryFromPath(pathname: string): string | undefined {
  const first = pathname.split("/").find((part) => part !== "");
  return first !== undefined && countrySegments.includes(first) ? first : undefined;
}
