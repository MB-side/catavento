// Runs the data collectors that are due (docs/05). Usage:
//   pnpm ingest                       run every provider that is due
//   pnpm ingest --provider ansg       run one provider if due
//   pnpm ingest --provider ansg --force   run it now, even if paused or not due
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { anyOrganisationSchema, siteSchema } from "@/lib/schemas";
import { RegionLookup } from "../ingest/core/regions";
import { runIngest } from "../ingest/core/runner";
import { providerModules } from "../ingest/sources";
import { readInputs } from "./lib/data/inputs";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const readGenerated = (file: string): unknown =>
  JSON.parse(readFileSync(path.join(process.cwd(), "data", "generated", file), "utf8"));

async function main(): Promise<void> {
  const inputs = readInputs();
  const runs = await runIngest({
    root: process.cwd(),
    providers: inputs.providers,
    modules: providerModules,
    regions: RegionLookup.fromFile(),
    countriesRegions: new Map(inputs.countries.map((c) => [c.code, new Set(c.regions)])),
    countryZones: new Map(inputs.countries.map((c) => [c.code, c.timezones[0] ?? "UTC"])),
    overviewCountries: inputs.overview.flatMap((r) => r.countries.map((c) => c.code)),
    directory: () => ({
      organisations: z.array(anyOrganisationSchema).parse(readGenerated("organisations.json")),
      sites: z.array(siteSchema).parse(readGenerated("sites.json")),
    }),
    only: value("--provider"),
    force: flag("--force"),
  });
  const failed = Object.values(runs).filter((r) => r.status === "failed").length;
  if (failed) console.warn(`ingest: ${failed} provider(s) failed; see data/ingest/_runs.json`);
}

void main();
