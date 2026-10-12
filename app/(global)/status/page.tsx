import Link from "next/link";
import { getBuildReport, getProviders } from "@/lib/data";
import { t, tOr } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import type { Provider, ProviderRun } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: t("pages.status.title"),
  description: t("pages.status.summary"),
  path: "/status",
});

const DAY_MS = 86_400_000;
const sydneyTime = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney",
  dateStyle: "medium",
  timeStyle: "short",
});
const sydneyDate = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney",
  dateStyle: "medium",
});
const plural = new Intl.PluralRules("en");

function when(iso: string | undefined): string {
  return iso ? sydneyTime.format(new Date(iso)) : t("status.never");
}

type State = ProviderRun["status"] | "paused" | "notRun";

const CHIP: Record<State, string> = {
  ok: "bg-info-tint text-link",
  unchanged: "bg-info-tint text-link",
  warning: "bg-notice-tint text-notice-text",
  blocked: "bg-notice-tint text-notice-text",
  failed: "bg-ink text-white",
  paused: "bg-outside text-muted-strong",
  notRun: "bg-outside text-muted-strong",
};

function ProviderStatus({ provider, run }: { provider: Provider; run?: ProviderRun }) {
  const collect = provider.collect;
  if (!collect) return null;
  const state: State = collect.paused ? "paused" : (run?.status ?? "notRun");
  const next =
    !collect.paused && run?.lastSuccessAt
      ? sydneyDate.format(
          new Date(new Date(run.lastSuccessAt).getTime() + collect.everyDays * DAY_MS),
        )
      : undefined;
  const everyForm = plural.select(collect.everyDays) === "one" ? "one" : "other";
  const rows: [string, React.ReactNode][] = [
    [
      t("status.every"),
      tOr(`status.everyDays.${everyForm}`, "status.everyDays.other", {
        count: String(collect.everyDays),
      }),
    ],
    [t("status.lastChecked"), when(run?.finishedAt)],
    [t("status.lastSuccess"), when(run?.lastSuccessAt)],
  ];
  if (next) rows.push([t("status.nextCheck"), t("status.nextCheckValue", { date: next })]);
  if (run) {
    rows.push([
      t("status.records"),
      t("status.recordsValue", {
        found: String(run.recordsFound),
        changed: String(run.recordsChanged),
      }),
    ]);
  }
  if (run?.guardDecision) {
    rows.push([
      t("status.changeCheck"),
      tOr(`status.guard.${run.guardDecision}`, "status.states.ok"),
    ]);
  }
  if (collect.paused && collect.pausedReason)
    rows.push([t("status.pausedReason"), collect.pausedReason]);
  const notes = run?.warnings ?? [];
  const notesForm = plural.select(notes.length) === "one" ? "one" : "other";
  const info = run?.info ?? [];
  const infoForm = plural.select(info.length) === "one" ? "one" : "other";

  return (
    <li
      className="rounded-[14px] border border-border bg-surface p-4 lg:p-5"
      id={`status-${provider.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-condensed text-[1.25rem] font-bold">{provider.name}</h3>
        <span
          className={cn("rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold", CHIP[state])}
        >
          {tOr(`status.states.${state}`, "status.states.notRun")}
        </span>
      </div>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-[0.9375rem] sm:grid-cols-[10rem_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[0.8125rem] font-medium text-muted sm:pt-0.5">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {notes.length > 0 && (
        <details className="mt-3">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold underline underline-offset-4">
            {tOr(`status.notesSummary.${notesForm}`, "status.notesSummary.other", {
              count: String(notes.length),
            })}
          </summary>
          <p className="mt-1 text-[0.875rem] text-muted">{t("status.notesExplainer")}</p>
          <ul className="mt-2 list-disc pl-5 text-[0.875rem] text-muted-strong">
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </details>
      )}
      {info.length > 0 && (
        <details className="mt-1">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold underline underline-offset-4">
            {tOr(`status.infoSummary.${infoForm}`, "status.infoSummary.other", {
              count: String(info.length),
            })}
          </summary>
          <ul className="mt-2 list-disc pl-5 text-[0.875rem] text-muted-strong">
            {info.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}

/** Status (docs/02 §5.12): the latest collection run for each automatically collected source. */
export default function StatusPage() {
  const report = getBuildReport();
  const collected = getProviders().filter((p) => p.collect);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-condensed text-[2rem] leading-tight font-bold">
        {t("pages.status.title")}
      </h1>
      <p className="mt-2 text-[1.0625rem]">{t("status.intro")}</p>

      <section aria-labelledby="collected" className="mt-8">
        <h2 id="collected" className="font-condensed text-[1.375rem] font-bold">
          {t("status.collectedHeading")}
        </h2>
        <p className="mt-1 text-[0.875rem] text-muted">{t("status.timeZoneNote")}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {collected.map((p) => (
            <ProviderStatus key={p.id} provider={p} run={report.providers[p.id]} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="manual" className="mt-10">
        <h2 id="manual" className="font-condensed text-[1.25rem] font-bold">
          {t("status.manualHeading")}
        </h2>
        <p className="mt-1 text-muted-strong">{t("status.manualText")}</p>
        <Link
          href="/sources/"
          className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          {t("status.sourcesLink")}
        </Link>
      </section>
    </div>
  );
}
