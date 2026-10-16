// Shared lookups for the visiting-pilot pages (D89): country names and page links, built at export time.
import "server-only";
import { getCountryName, getTourOperators, getVisitingCountries } from "@/lib/data";
import { visitingHref } from "@/lib/visiting";

/** Names for every country a page may mention, and links for those that have a visiting page. */
export function countryLookups(): { names: Record<string, string>; pages: Record<string, string> } {
  const names: Record<string, string> = {};
  const pages: Record<string, string> = {};
  for (const c of getVisitingCountries()) {
    names[c.code] = c.name;
    pages[c.code] = visitingHref(c);
  }
  for (const tour of getTourOperators()) {
    for (const code of [tour.basedIn, ...tour.destinations]) {
      names[code] ??=
        getCountryName(code) ?? new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
    }
  }
  return { names, pages };
}

/** Whether a country has a visiting page (overview countries without rules, help or tours don't). */
export function hasVisitingPage(code: string): boolean {
  return getVisitingCountries().some((c) => c.code === code.toUpperCase());
}
