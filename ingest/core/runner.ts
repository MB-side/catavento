// Runs the providers that are due, applies the change guard, and records each run (docs/05 §3, §6).
// Output per provider: data/ingest/<id>.json (last accepted records) and data/ingest/_runs.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { providerRunSchema, siteSchema } from "@/lib/schemas";
import type { Provider, ProviderRun, Site } from "@/lib/types";
import { PoliteFetcher } from "./fetcher";
import { changeGuard, isBlocked } from "./guard";
import type { RegionLookup } from "./regions";

export interface ProviderContext {
  fetcher: PoliteFetcher;
  regions: RegionLookup;
  country: string;
  allowedRegions: ReadonlySet<string>;
  previous?: ProviderRun;
  force: boolean;
}

export interface CollectResult {
  unchanged: boolean;
  contentHash: string;
  records: Site[];
  invalid: number;
  warnings: string[];
}

export interface ProviderModule {
  id: string;
  collect(ctx: ProviderContext): Promise<CollectResult>;
}

export const ingestFileSchema = z.object({
  providerId: z.string(),
  fetchedAt: z.iso.datetime({ offset: true }),
  contentHash: z.string(),
  records: z.array(siteSchema),
});
export type IngestFile = z.infer<typeof ingestFileSchema>;
export const runsFileSchema = z.record(z.string(), providerRunSchema);

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
    // Country-specific providers name exactly one country in providers.yaml.
    const country = provider.countries.length === 1 ? provider.countries[0] : undefined;
    if (!country || country === "*") {
      log(`${mod.id}: skipped (collector needs a single country in providers.yaml)`);
      continue;
    }

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
        country,
        allowedRegions: opts.countriesRegions.get(country) ?? new Set(),
        previous: last,
        force: !!opts.force,
      });
      if (result.unchanged) {
        run = {
          status: "unchanged",
          startedAt,
          finishedAt: now().toISOString(),
          recordsFound: previousFile?.records.length ?? 0,
          recordsChanged: 0,
          warnings: last?.warnings ?? [],
          guardDecision: last?.guardDecision,
          lastSuccessAt: now().toISOString(),
          contentHash: result.contentHash,
        };
      } else {
        const guard = changeGuard({
          previousCount: previousFile?.records.length,
          validCount: result.records.length,
          invalidCount: result.invalid,
        });
        const warnings = [...(guard.reason ? [guard.reason] : []), ...result.warnings];
        if (isBlocked(guard.decision)) {
          run = {
            status: "blocked",
            startedAt,
            finishedAt: now().toISOString(),
            recordsFound: result.records.length,
            recordsChanged: 0,
            warnings,
            guardDecision: guard.decision,
            lastSuccessAt: last?.lastSuccessAt,
            contentHash: last?.contentHash,
          };
        } else {
          const before = new Map(
            (previousFile?.records ?? []).map((r) => [r.id, JSON.stringify(r)]),
          );
          const changed =
            result.records.filter((r) => before.get(r.id) !== JSON.stringify(r)).length +
            [...before.keys()].filter((id) => !result.records.some((r) => r.id === id)).length;
          const out: IngestFile = {
            providerId: mod.id,
            fetchedAt: startedAt,
            contentHash: result.contentHash,
            records: [...result.records].sort((a, b) => a.id.localeCompare(b.id)),
          };
          writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
          run = {
            status: warnings.length ? "warning" : "ok",
            startedAt,
            finishedAt: now().toISOString(),
            recordsFound: result.records.length,
            recordsChanged: changed,
            warnings,
            guardDecision: guard.decision,
            lastSuccessAt: now().toISOString(),
            contentHash: result.contentHash,
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
