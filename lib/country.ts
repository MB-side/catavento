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
