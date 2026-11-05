"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  COUNTRY_KEY,
  countryFromPath,
  defaultCountrySegment,
  hasSections,
} from "@/lib/country-codes";

/**
 * The country for section links (D93): from the page's URL, else the visitor's last country (kept
 * in this browser only), else the default country. `sections` is true for countries with the full
 * set of section pages (Australia, New Zealand); other countries have one page.
 */
export function useCurrentCountry(): {
  pathname: string;
  country: string;
  onCountryPage: boolean;
  sections: boolean;
} {
  const pathname = usePathname();
  const fromPath = countryFromPath(pathname);
  const [remembered, setRemembered] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      if (fromPath) localStorage.setItem(COUNTRY_KEY, fromPath);
      const saved = localStorage.getItem(COUNTRY_KEY) ?? undefined;
      // Reading storage after hydration keeps the static HTML identical for everyone.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemembered(saved && /^[a-z]{2}$/.test(saved) ? saved : undefined);
    } catch {
      // Storage blocked: fall back to the default country.
    }
  }, [fromPath]);

  const country = fromPath ?? remembered ?? defaultCountrySegment;
  return {
    pathname,
    country,
    onCountryPage: fromPath !== undefined,
    sections: hasSections(country),
  };
}
