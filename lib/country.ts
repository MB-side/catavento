// Country configuration access (docs/03 §3). Server-side only: reads data/manual/countries.yaml
// at build time. Client code uses lib/country-codes.ts instead.
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { siteConfig } from "@/site.config";
import { countriesFileSchema } from "./schemas";
import type { Country, CountryCode } from "./types";

const COUNTRIES_FILE = path.join(process.cwd(), "data", "manual", "countries.yaml");

let cache: Country[] | undefined;

/** Parses and validates a countries.yaml document. Exported for tests. */
export function parseCountries(yamlText: string): Country[] {
  return countriesFileSchema.parse(parse(yamlText));
}

/** Every country in countries.yaml, validated. */
export function getAllCountries(): Country[] {
  cache ??= parseCountries(readFileSync(COUNTRIES_FILE, "utf8"));
  return cache;
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
