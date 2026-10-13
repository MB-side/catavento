// Data health (D79): what needs someone's attention, and nothing else. Pure functions; the
// `pnpm health` command and the daily GitHub job feed them the repository's own files.
import type { Provider, ProviderRun } from "@/lib/types";

const DAY_MS = 86_400_000;

/** How long hand-entered facts stay fresh before they're re-checked on the official page. */
export const USE_BY_DAYS = { prices: 183, gear: 365, siteWind: 365 } as const;
/** The outside-link check runs monthly; a report older than this means it has stopped. */
export const LINK_REPORT_MAX_DAYS = 45;

export interface LinkReport {
  checkedAt: string;
  total: number;
  broken: { url: string; page: string; error: string }[];
}

export interface WorkflowRun {
  name: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
}

export interface HealthInput {
  now: Date;
  providers: Pick<Provider, "id" | "name" | "collect">[];
  runs: Record<string, ProviderRun>;
  offerings: { org: string; title: string; url: string; sourceCheckedAt: string }[];
  gearCategories: { org: string; source: string; checked: string }[];
  siteWind: { site: string; source: string; checked: string }[];
  links?: LinkReport;
  /** Each workflow's most recent finished run, newest first (from GitHub). */
  workflows?: WorkflowRun[];
}

export type ProblemKind = "source" | "workflow" | "links" | "stale";

export interface HealthProblem {
  kind: ProblemKind;
  /** Stable key, so an unchanged problem isn't reported as new. */
  key: string;
  text: string;
}

const daysSince = (iso: string, now: Date) => (now.getTime() - new Date(iso).getTime()) / DAY_MS;
const date = (iso: string) => iso.slice(0, 10);

export function checkHealth(input: HealthInput): HealthProblem[] {
  const { now } = input;
  const out: HealthProblem[] = [];

  // Sources: failed or blocked, or not successfully collected for twice their schedule (+1 day).
  for (const p of input.providers) {
    if (!p.collect || p.collect.paused) continue;
    const run = input.runs[p.id];
    if (!run) {
      out.push({
        kind: "source",
        key: `source-never:${p.id}`,
        text: `${p.name} has never been collected.`,
      });
      continue;
    }
    if (run.status === "failed" || run.status === "blocked") {
      out.push({
        kind: "source",
        key: `source-${run.status}:${p.id}`,
        text: `${p.name}: the last collection (${date(run.finishedAt)}) ${run.status === "failed" ? "failed" : "was blocked by the safety check, so the previous data was kept"}.`,
      });
    }
    const last =
      run.lastSuccessAt ??
      (run.status === "failed" || run.status === "blocked" ? undefined : run.finishedAt);
    const limit = p.collect.everyDays * 2 + 1;
    if (!last || daysSince(last, now) > limit) {
      out.push({
        kind: "source",
        key: `source-overdue:${p.id}`,
        text: `${p.name} is overdue: last successful collection ${last ? date(last) : "never"} (it should run every ${p.collect.everyDays} day${p.collect.everyDays === 1 ? "" : "s"}).`,
      });
    }
  }

  // GitHub jobs whose latest run failed (collection, publishing, link check).
  const seen = new Set<string>();
  for (const w of input.workflows ?? []) {
    if (seen.has(w.name)) continue;
    seen.add(w.name);
    if (w.conclusion === "failure") {
      out.push({
        kind: "workflow",
        key: `workflow:${w.name}`,
        text: `The "${w.name}" job failed on ${date(w.createdAt)}: ${w.url}`,
      });
    }
  }

  // Outside links.
  if (input.links) {
    if (daysSince(input.links.checkedAt, now) > LINK_REPORT_MAX_DAYS) {
      out.push({
        kind: "links",
        key: "links-overdue",
        text: `The monthly outside-link check last ran on ${date(input.links.checkedAt)}.`,
      });
    }
    for (const b of input.links.broken) {
      out.push({
        kind: "links",
        key: `link:${b.url}`,
        text: `Broken link on /${b.page}: ${b.url} (${b.error})`,
      });
    }
  }

  // Hand-entered facts past their use-by date.
  for (const o of input.offerings) {
    if (daysSince(o.sourceCheckedAt, now) > USE_BY_DAYS.prices) {
      out.push({
        kind: "stale",
        key: `stale-price:${o.org}:${o.title}`,
        text: `Price "${o.title}" (${o.org}), checked ${o.sourceCheckedAt}: re-check ${o.url}`,
      });
    }
  }
  for (const g of input.gearCategories) {
    if (daysSince(g.checked, now) > USE_BY_DAYS.gear) {
      out.push({
        kind: "stale",
        key: `stale-gear:${g.org}`,
        text: `What ${g.org} sells, checked ${g.checked}: re-check ${g.source}`,
      });
    }
  }
  for (const w of input.siteWind) {
    if (daysSince(w.checked, now) > USE_BY_DAYS.siteWind) {
      out.push({
        kind: "stale",
        key: `stale-wind:${w.site}`,
        text: `Wind directions for ${w.site}, checked ${w.checked}: re-check ${w.source}`,
      });
    }
  }
  return out;
}

const HEADINGS: Record<ProblemKind, string> = {
  source: "Data sources",
  workflow: "GitHub jobs",
  links: "Outside links",
  stale: "Hand-entered facts to re-check",
};

/** A short fingerprint of the problem set, so a changed set can be announced and an unchanged one isn't. */
export function problemFingerprint(problems: HealthProblem[]): string {
  const keys = problems
    .map((p) => p.key)
    .sort()
    .join("\n");
  let h = 0;
  for (let i = 0; i < keys.length; i++) h = (Math.imul(31, h) + keys.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Plain-language report, grouped by kind; empty problems give a one-line all-clear. */
export function healthReport(problems: HealthProblem[], now: Date): string {
  if (problems.length === 0)
    return `All clear (${now.toISOString().slice(0, 16).replace("T", " ")} UTC).`;
  const lines = [
    `${problems.length} thing${problems.length === 1 ? "" : "s"} need${problems.length === 1 ? "s" : ""} attention (${now.toISOString().slice(0, 16).replace("T", " ")} UTC).`,
  ];
  for (const kind of Object.keys(HEADINGS) as ProblemKind[]) {
    const group = problems.filter((p) => p.kind === kind);
    if (group.length === 0) continue;
    lines.push("", `### ${HEADINGS[kind]}`, ...group.map((p) => `- ${p.text}`));
  }
  return lines.join("\n");
}
