// Reads and validates every input file for the data build (data/seed and data/manual).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { parse as parseYaml } from "yaml";
import type { z } from "zod";
import {
  brandsFileSchema,
  clubAliasesFileSchema,
  gearCategoriesFileSchema,
  countriesFileSchema,
  nzSampleSitesFileSchema,
  offeringsFileSchema,
  orgMergesFileSchema,
  overridesFileSchema,
  providersFileSchema,
  siteStationsFileSchema,
  siteStewardsFileSchema,
} from "@/lib/schemas";
import { ingestFileSchema, runsFileSchema } from "@/ingest/core/runner";
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

  const ingestDir = dataDir("ingest");
  const ingestFiles = existsSync(ingestDir)
    ? readdirSync(ingestDir)
        .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
        .sort()
        .map((f) => ingestFileSchema.parse(JSON.parse(readFileSync(path.join(ingestDir, f), "utf8"))))
    : [];
  const runsPath = path.join(ingestDir, "_runs.json");
  const runs = existsSync(runsPath) ? runsFileSchema.parse(JSON.parse(readFileSync(runsPath, "utf8"))) : {};

  return {
    ingestedSites: ingestFiles.flatMap((f) => f.sites ?? []),
    ingestedOrgs: ingestFiles.flatMap((f) => f.orgs ?? []),
    ingestedEvents: ingestFiles.flatMap((f) => f.events ?? []),
    ingestedNotices: ingestFiles.flatMap((f) => f.notices ?? []),
    stewardEvidence: ingestFiles.flatMap((f) => f.stewardEvidence ?? []),
    runs,
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
    brands: readYaml("brands.yaml", brandsFileSchema) ?? [],
    gearCategories: readYaml("gear-categories.yaml", gearCategoriesFileSchema) ?? [],
  };
}
