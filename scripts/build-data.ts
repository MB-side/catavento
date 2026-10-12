// Merges seed + ingest + manual data into data/generated (docs/03 §6).
// M0: nothing to merge yet; validates the country configuration so a broken
// countries.yaml fails the build early. The full merge arrives in M1.
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { countriesFileSchema } from "../lib/schemas";

const file = path.join(process.cwd(), "data", "manual", "countries.yaml");
const countries = countriesFileSchema.parse(parse(readFileSync(file, "utf8")));
console.log(
  `build-data: countries.yaml valid (${countries.map((c) => c.code).join(", ")}). Data merge arrives in M1.`,
);
