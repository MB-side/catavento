// Shared lookups for pages that mention countries (D89, D93): names and page links, built at export time.
import "server-only";
import { getCountryName, getTourOperators } from "@/lib/data";
import { getCountryProfiles } from "@/lib/country-profile";
import { visitingHref } from "@/lib/visiting";

/** Names for every country a page may mention, and links for those that have a page. */
export function countryLookups(): { names: Record<string, string>; pages: Record<string, string> } {
  const names: Record<string, string> = {};
  const pages: Record<string, string> = {};
  for (const c of getCountryProfiles()) {
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
