// Runs the providers that are due, applies the change guard, and records each run (docs/05 §3, §6).
// Output per provider: data/ingest/<id>.json (last accepted records) and data/ingest/_runs.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  collectedOrgSchema,
  eventSchema,
  noticeSchema,
  providerRunSchema,
  siteSchema,
  overviewSiteSchema,
  stewardEvidenceSchema,
} from "@/lib/schemas";
import type {
  CollectedOrg,
  EventItem,
  Notice,
  Organisation,
  Provider,
  ProviderRun,
  Site,
  OverviewSite,
  StewardEvidence,
} from "@/lib/types";
import { PoliteFetcher } from "./fetcher";
import { changeGuard, isBlocked } from "./guard";
import type { RegionLookup } from "./regions";

/** A country a provider collects for, with the region codes allowed there. */
export interface CountryScope {
  code: string;
  regions: ReadonlySet<string>;
  timezone?: string; // the country's main time zone, for times published without one
}

/** What the site already knows, for providers that look things up against it (club websites). */
export interface Directory {
  organisations: Organisation[];
  sites: Site[];
}

export interface ProviderContext {
  fetcher: PoliteFetcher;
  regions: RegionLookup;
  countries: CountryScope[];
  directory: () => Directory;
  previous?: ProviderRun;
  previousRecords?: IngestRecords;
  force: boolean;
  now: Date;
  /** ISO codes of overview-region countries (D83): light site lists only. */
  overview?: string[];
}

/** Everything a provider can collect. Each kind is optional. */
export interface IngestRecords {
  sites?: Site[];
  orgs?: CollectedOrg[];
  events?: EventItem[];
  notices?: Notice[];
  stewardEvidence?: StewardEvidence[];
  overviewSites?: OverviewSite[];
}

export interface CollectResult {
  unchanged: boolean;
  contentHash: string;
  records: IngestRecords;
  invalid: number;
  warnings: string[];
  info?: string[]; // neutral notes for /status, e.g. what each club website gave
  sourceVersion?: string; // the source's version tag, kept for the next conditional request
}

export interface ProviderModule {
  id: string;
  collect(ctx: ProviderContext): Promise<CollectResult>;
}

export const ingestFileSchema = z.object({
  providerId: z.string(),
  fetchedAt: z.iso.datetime({ offset: true }),
  contentHash: z.string(),
  sites: z.array(siteSchema).optional(),
  orgs: z.array(collectedOrgSchema).optional(),
  events: z.array(eventSchema).optional(),
  notices: z.array(noticeSchema).optional(),
  stewardEvidence: z.array(stewardEvidenceSchema).optional(),
  overviewSites: z.array(overviewSiteSchema).optional(),
});
export type IngestFile = z.infer<typeof ingestFileSchema>;
export const runsFileSchema = z.record(z.string(), providerRunSchema);

const KINDS = ["sites", "orgs", "events", "notices", "stewardEvidence", "overviewSites"] as const;
// Sites and directories are stable, so a sudden drop means a broken source. Events, notices and
// evidence come and go naturally, so only their validity is checked.
const STABLE_KINDS = ["sites", "orgs", "overviewSites"] as const;

const count = (r: IngestRecords | undefined, kinds: readonly (keyof IngestRecords)[]) =>
  kinds.reduce((n, k) => n + (r?.[k]?.length ?? 0), 0);

function recordIds(r: IngestRecords | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const k of KINDS)
    for (const rec of r?.[k] ?? []) out.set(`${k}|${rec.id}`, JSON.stringify(rec));
  return out;
}

const HOUR = 3_600_000;

/** Due when never run, or when its interval has passed (with 6 hours' slack for schedule drift). */
export function isDue(provider: Provider, last: ProviderRun | undefined, now: Date): boolean {
  if (!provider.collect || provider.collect.paused || !provider.enabled) return false;
  const lastOk = last?.lastSuccessAt ?? undefined;
  if (!lastOk) return true;
  return (
    now.getTime() - new Date(lastOk).getTime() >= provider.collect.everyDays * 24 * HOUR - 6 * HOUR
  );
}

export interface RunOptions {
  root: string;
  providers: Provider[];
  modules: ProviderModule[];
  regions: RegionLookup;
  countriesRegions: Map<string, Set<string>>;
  countryZones?: Map<string, string>;
  overviewCountries?: string[];
  directory?: () => Directory;
  only?: string;
  force?: boolean;
  fetcher?: PoliteFetcher;
  now?: () => Date;
  log?: (line: string) => void;
}

export async function runIngest(opts: RunOptions): Promise<Record<string, ProviderRun>> {
  const dir = path.join(opts.root, "data", "ingest");
  mkdirSync(dir, { recursive: true });
  const runsFile = path.join(dir, "_runs.json");
  const runs = existsSync(runsFile)
    ? runsFileSchema.parse(JSON.parse(readFileSync(runsFile, "utf8")))
    : {};
  const fetcher = opts.fetcher ?? new PoliteFetcher();
  const now = opts.now ?? (() => new Date());
  const log = opts.log ?? console.log;
  const directory = opts.directory ?? (() => ({ organisations: [], sites: [] }));

  for (const mod of opts.modules) {
    const provider = opts.providers.find((p) => p.id === mod.id);
    if (!provider) continue;
    if (opts.only && opts.only !== mod.id) continue;
    const last = runs[mod.id];
    const due = opts.force
      ? opts.only === mod.id || !provider.collect?.paused
      : isDue(provider, last, now());
    if (!due) {
      log(
        `${mod.id}: not due${provider.collect?.paused ? ` (paused: ${provider.collect.pausedReason ?? "no reason given"})` : ""}`,
      );
      continue;
    }
    // "*" means every country in countries.yaml.
    const codes = provider.countries.includes("*")
      ? [...opts.countriesRegions.keys()]
      : provider.countries;
    const countries = codes.map((code) => ({
      code,
      regions: opts.countriesRegions.get(code) ?? new Set<string>(),
      timezone: opts.countryZones?.get(code),
    }));

    const startedAt = now().toISOString();
    const file = path.join(dir, `${mod.id}.json`);
    const previousFile = existsSync(file)
      ? ingestFileSchema.parse(JSON.parse(readFileSync(file, "utf8")))
      : undefined;
    let run: ProviderRun;
    try {
      const result = await mod.collect({
        fetcher,
        regions: opts.regions,
        countries,
        directory,
        previous: last,
        previousRecords: previousFile,
        force: !!opts.force,
        now: now(),
        overview: opts.overviewCountries ?? [],
      });
      if (result.unchanged) {
        run = {
          status: "unchanged",
          startedAt,
          finishedAt: now().toISOString(),
          recordsFound: count(previousFile, KINDS),
          recordsChanged: 0,
          warnings: last?.warnings ?? [],
          info: last?.info,
          sourceVersion: result.sourceVersion ?? last?.sourceVersion,
          guardDecision: last?.guardDecision,
          lastSuccessAt: now().toISOString(),
          contentHash: result.contentHash,
        };
      } else {
        const guard = changeGuard({
          previousCount: previousFile ? count(previousFile, STABLE_KINDS) : undefined,
          validCount: count(result.records, STABLE_KINDS),
          invalidCount: result.invalid,
          totalValid: count(result.records, KINDS),
        });
        const warnings = [...(guard.reason ? [guard.reason] : []), ...result.warnings];
        const found = count(result.records, KINDS);
        if (isBlocked(guard.decision)) {
          run = {
            status: "blocked",
            startedAt,
            finishedAt: now().toISOString(),
            recordsFound: found,
            recordsChanged: 0,
            warnings,
            guardDecision: guard.decision,
            lastSuccessAt: last?.lastSuccessAt,
            contentHash: last?.contentHash,
            sourceVersion: last?.sourceVersion,
          };
        } else {
          const before = recordIds(previousFile);
          const after = recordIds(result.records);
          const changed =
            [...after].filter(([k, v]) => before.get(k) !== v).length +
            [...before.keys()].filter((k) => !after.has(k)).length;
          const out: IngestFile = {
            providerId: mod.id,
            fetchedAt: startedAt,
            contentHash: result.contentHash,
          };
          for (const k of KINDS) {
            const list = result.records[k];
            if (list)
              (out as Record<string, unknown>)[k] = [...list].sort((a, b) =>
                a.id.localeCompare(b.id),
              );
          }
          writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
          run = {
            status: warnings.length ? "warning" : "ok",
            startedAt,
            finishedAt: now().toISOString(),
            recordsFound: found,
            recordsChanged: changed,
            warnings,
            guardDecision: guard.decision,
            lastSuccessAt: now().toISOString(),
            contentHash: result.contentHash,
            info: result.info?.length ? result.info : undefined,
            sourceVersion: result.sourceVersion,
          };
        }
      }
    } catch (error) {
      run = {
        status: "failed",
        startedAt,
        finishedAt: now().toISOString(),
        recordsFound: 0,
        recordsChanged: 0,
        warnings: [error instanceof Error ? error.message : String(error)],
        lastSuccessAt: last?.lastSuccessAt,
        contentHash: last?.contentHash,
        sourceVersion: last?.sourceVersion,
      };
    }
    runs[mod.id] = run;
    log(
      `${mod.id}: ${run.status}, ${run.recordsFound} records, ${run.recordsChanged} changed, ${run.warnings.length} warnings`,
    );
  }

  writeFileSync(runsFile, `${JSON.stringify(runs, null, 2)}\n`);
  return runs;
}
