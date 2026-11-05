// Every country Catavento has a page for (D93): the fully and partly covered countries, every overview
// country, and countries only tours go to. One page each, at /<code>/, with the same sections.
import "server-only";
import { getEnabledCountries } from "@/lib/country";
import { getGuide, getOverviewRegions, getTourOperators } from "@/lib/data";
import type { Country, CountryGuide, OverviewRegion } from "@/lib/types";

export type Coverage = "full" | "partial" | "overview";

export interface CountryProfile {
  code: string; // ISO code, upper case
  name: string;
  coverage: Coverage;
  /** The fully or partly covered country's configuration (Australia, New Zealand). */
  country?: Country;
  /** The overview region it belongs to (Europe, or a single-country destination). */
  region?: OverviewRegion;
  guide?: CountryGuide;
}

let cache: CountryProfile[] | undefined;

export function getCountryProfiles(): CountryProfile[] {
  if (cache) return cache;
  const out: CountryProfile[] = getEnabledCountries().map((c) => ({
    code: c.code,
    name: c.name,
    coverage: c.coverage === "full" ? "full" : "partial",
    country: c,
    guide: getGuide(c.code),
  }));
  const seen = new Set(out.map((p) => p.code));
  for (const region of getOverviewRegions()) {
    for (const c of region.countries) {
      if (seen.has(c.code)) continue;
      seen.add(c.code);
      out.push({
        code: c.code,
        name: c.name,
        coverage: "overview",
        region,
        guide: getGuide(c.code),
      });
    }
  }
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  for (const code of [...new Set(getTourOperators().flatMap((t) => t.destinations))].sort()) {
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ code, name: names.of(code) ?? code, coverage: "overview" });
  }
  cache = out;
  return out;
}

export function getCountryProfile(code: string): CountryProfile | undefined {
  const upper = code.toUpperCase();
  return getCountryProfiles().find((p) => p.code === upper);
}

/** A country's page. */
export const countryPath = (code: string): string => `/${code.toLowerCase()}/`;
