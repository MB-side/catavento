// Reads and validates every input file for the data build (data/seed and data/manual).
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { parse as parseYaml } from "yaml";
import type { z } from "zod";
import {
  clubAliasesFileSchema,
  countriesFileSchema,
  nzSampleSitesFileSchema,
  offeringsFileSchema,
  orgMergesFileSchema,
  overridesFileSchema,
  providersFileSchema,
  siteStationsFileSchema,
  siteStewardsFileSchema,
} from "@/lib/schemas";
import type { BuildInputs } from "./build";
import type { CsvRow } from "./seed";

// The New Zealand sample sites were compiled for pack v1.2 (docs/10 D21).
const SAMPLE_SITES_CHECKED = "2026-10-09";

export function readInputs(root: string = process.cwd()): BuildInputs {
  const dataDir = (...p: string[]) => path.join(root, "data", ...p);

  function readYaml<T>(file: string, schema: z.ZodType<T>): T {
    try {
      return schema.parse(parseYaml(readFileSync(dataDir("manual", file), "utf8")));
    } catch (error) {
      throw new Error(`data/manual/${file} is invalid:\n${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function readCsv(file: string): CsvRow[] {
    return parseCsv(readFileSync(dataDir("seed", file), "utf8"), {
      columns: true,
      skip_empty_lines: true,
    }) as CsvRow[];
  }

  return {
    directoryRows: readCsv("directory.csv"),
    stationRows: readCsv("weather-stations.csv"),
    countries: readYaml("countries.yaml", countriesFileSchema),
    providers: readYaml("providers.yaml", providersFileSchema),
    orgMerges: readYaml("org-merges.yaml", orgMergesFileSchema),
    overrides: readYaml("overrides.yaml", overridesFileSchema) ?? {},
    clubAliases: readYaml("club-aliases.yaml", clubAliasesFileSchema),
    siteStations: readYaml("site-stations.yaml", siteStationsFileSchema) ?? {},
    siteStewards: readYaml("site-stewards.yaml", siteStewardsFileSchema) ?? {},
    sampleSites: readYaml("nz-sample-sites.yaml", nzSampleSitesFileSchema),
    sampleSitesChecked: SAMPLE_SITES_CHECKED,
    offerings: readYaml("offerings.yaml", offeringsFileSchema),
  };
}
