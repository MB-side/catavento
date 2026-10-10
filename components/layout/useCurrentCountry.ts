"use client";

import { usePathname } from "next/navigation";
import { countryFromPath, defaultCountrySegment } from "@/lib/country-codes";

/**
 * The country for section links: from the page's URL, else the default country.
 * The visitor's saved choice (ht.country) is added with the country switcher in M1.
 */
export function useCurrentCountry(): { pathname: string; country: string; onCountryPage: boolean } {
  const pathname = usePathname();
  const fromPath = countryFromPath(pathname);
  return {
    pathname,
    country: fromPath ?? defaultCountrySegment,
    onCountryPage: fromPath !== undefined,
  };
}
