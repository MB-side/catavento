// Country configuration access (docs/03 §3). Server-side only: reads the validated countries.json
// through lib/data. Client code uses lib/country-codes.ts instead.
import "server-only";
import { siteConfig } from "@/site.config";
import { getCountries } from "@/lib/data";
import type { Country, CountryCode } from "./types";

/** Every country in countries.yaml. */
export function getAllCountries(): Country[] {
  return getCountries();
}

/** Countries that are both enabled in countries.yaml and listed in siteConfig.enabledCountries. */
export function getEnabledCountries(): Country[] {
  const listed = new Set<string>(siteConfig.enabledCountries);
  return getAllCountries().filter((c) => c.enabled && listed.has(c.code));
}

/** Looks up an enabled country by code, case-insensitively ("au" or "AU"). */
export function getCountry(code: CountryCode): Country | undefined {
  const upper = code.toUpperCase();
  return getEnabledCountries().find((c) => c.code === upper);
}

/** For pages under /[country]: the enabled country for the URL segment, or undefined. */
export async function countryFromParams(
  params: Promise<{ country: string }>,
): Promise<Country | undefined> {
  const { country } = await params;
  return getCountry(country);
}

/** Countries with full coverage get the whole section; sample countries a short version. */
export function fullCoverageCountries(): Country[] {
  return getEnabledCountries().filter((c) => c.coverage === "full");
}
