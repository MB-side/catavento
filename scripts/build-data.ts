// Merges seed + ingest + manual data into data/generated (docs/03 §6) and validates the result.
// Any invalid record stops the build: nothing broken is ever published.
// Collected (ingest) data joins in M2.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  anyOrganisationSchema,
  brandSchema,
  buildReportSchema,
  countrySchema,
  eventSchema,
  noticeSchema,
  offeringSchema,
  resourceSchema,
  overviewSiteSchema,
  tourOperatorSchema,
  visitorHelpSchema,
  countryGuideSchema,
  overviewRegionSchema,
  siteSchema,
  stationSchema,
} from "../lib/schemas";
import { buildData } from "./lib/data/build";
import { readInputs } from "./lib/data/inputs";

const OUT = path.join(process.cwd(), "data", "generated");

function validate<T>(name: string, schema: z.ZodType<T>, rows: unknown[]): void {
  rows.forEach((row, i) => {
    const result = schema.safeParse(row);
    if (!result.success) {
      const id = (row as { id?: string }).id ?? `#${i}`;
      throw new Error(`${name}: record ${id} is invalid:\n${z.prettifyError(result.error)}`);
    }
  });
}

/** IDs must not change once published (docs/04 §1): report any that disappeared. */
function removedIds(file: string, current: { id: string }[]): string[] {
  const full = path.join(OUT, file);
  if (!existsSync(full)) return [];
  const previous = JSON.parse(readFileSync(full, "utf8")) as { id: string }[];
  const now = new Set(current.map((r) => r.id));
  return previous.map((r) => r.id).filter((id) => !now.has(id));
}

function write(file: string, data: unknown): void {
  writeFileSync(path.join(OUT, file), `${JSON.stringify(data, null, 2)}\n`);
}

function main(): void {
  const out = buildData(readInputs());

  validate("countries", countrySchema, out.countries);
  validate("organisations", anyOrganisationSchema, out.organisations);
  validate("sites", siteSchema, out.sites);
  validate("stations", stationSchema, out.stations);
  validate("events", eventSchema, out.events);
  validate("notices", noticeSchema, out.notices);
  validate("brands", brandSchema, out.brands);
  validate("offerings", offeringSchema, out.offerings);
  validate("resources", resourceSchema, out.resources);
  validate("overview regions", overviewRegionSchema, out.overview.regions);
  validate("guides", countryGuideSchema, out.overview.guides);
  validate("overview sites", overviewSiteSchema, out.overviewSites);
  validate("visitor help", visitorHelpSchema, out.visiting.help);
  validate("tour operators", tourOperatorSchema, out.visiting.tours);

  for (const [file, records] of [
    ["organisations.json", out.organisations],
    ["sites.json", out.sites],
    ["stations.json", out.stations],
  ] as const) {
    for (const id of removedIds(file, records)) {
      out.report.build.warnings.push({
        code: "id-removed",
        message: `${id} was published before and is now gone; pin it in overrides.yaml if it was renamed`,
        recordId: id,
      });
    }
  }
  buildReportSchema.parse(out.report);

  mkdirSync(OUT, { recursive: true });
  write("countries.json", out.countries);
  write("providers.json", out.providers);
  write("organisations.json", out.organisations);
  write("sites.json", out.sites);
  write("stations.json", out.stations);
  write("events.json", out.events);
  write("notices.json", out.notices);
  write("brands.json", out.brands);
  write("offerings.json", out.offerings);
  write("resources.json", out.resources);
  write("overview.json", out.overview);
  write("overview-sites.json", out.overviewSites);
  write("visiting.json", out.visiting);
  write("_report.json", out.report);

  const c = out.report.build.counts;
  console.log(
    `build-data: ${c.organisations} organisations (${c.clubs} clubs, ${c.schools} schools), ${c.sites} sites, ` +
      `${c.stations} visible stations, ${c.providers} providers, ${c.resources} resources.`,
  );
  for (const w of out.report.build.warnings) console.warn(`  ! ${w.code}: ${w.message}`);
}

try {
  main();
} catch (error) {
  console.error(`build-data failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
