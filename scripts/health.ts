// What needs attention, from the repository's own files (D79). Prints a plain report; with
// --out writes it (plus a fingerprint line) for the daily GitHub health job. Read-only.
//   pnpm health
//   pnpm health --out health.md     (GitHub job; HEALTH_WORKFLOWS may hold recent job runs as JSON)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { linkExceptionsFileSchema } from "@/lib/schemas";
import { readInputs } from "./lib/data/inputs";
import {
  checkHealth,
  healthReport,
  problemFingerprint,
  type LinkReport,
  type WorkflowRun,
} from "./lib/health";

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const out = outIndex >= 0 ? args[outIndex + 1] : undefined;

const input = readInputs();
const linksPath = path.join(process.cwd(), "data", "reports", "external-links.json");
const links = existsSync(linksPath)
  ? (JSON.parse(readFileSync(linksPath, "utf8")) as LinkReport)
  : undefined;
const exceptionsPath = path.join(process.cwd(), "data", "manual", "link-exceptions.yaml");
const linkExceptions = existsSync(exceptionsPath)
  ? (linkExceptionsFileSchema.parse(parseYaml(readFileSync(exceptionsPath, "utf8"))) ?? [])
  : [];
const workflows = process.env.HEALTH_WORKFLOWS
  ? (JSON.parse(process.env.HEALTH_WORKFLOWS) as WorkflowRun[])
  : undefined;
const now = new Date();

const problems = checkHealth({
  now,
  providers: input.providers,
  runs: input.runs,
  offerings: input.offerings.map((o) => ({
    org: o.org,
    title: o.title,
    url: o.url,
    sourceCheckedAt: o.sourceCheckedAt,
  })),
  gearCategories: input.gearCategories,
  siteWind: input.siteWind,
  links,
  linkExceptions,
  workflows,
});
const report = healthReport(problems, now);
console.log(report);
if (out)
  writeFileSync(
    out,
    `${report}\n\n<!-- health:${problemFingerprint(problems)} count:${problems.length} -->\n`,
  );
