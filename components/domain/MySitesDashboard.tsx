"use client";

// My Sites (docs/02 §5.2): saved sites with a 3-day outlook strip, station buttons, units and
// personal speed limits, "Check these sites in Where To Fly", and "Share my list". Everything is
// kept on this device. The list works offline from a local copy; the outlook needs a connection.
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { OutlookLegend, SiteOutlook, useForecasts, useSettings } from "@/components/domain/Outlook";
import { SiteCard } from "@/components/domain/SiteCard";
import { t, tOr } from "@/lib/messages";
import {
  addSites,
  cacheSummaries,
  mySitesSnapshot,
  readSummaryCache,
  removeSites,
  setSpeedLimits,
  setUnits,
  subscribeMySites,
} from "@/lib/my-sites";
import { KMH_TO_KT } from "@/lib/outlook";
import { withBasePath } from "@/lib/paths";
import type { SiteSummary } from "@/lib/site-summary";
import { Anchor } from "@/components/ui/anchor";

const WTF_HOME = "https://wheretofly.info/";

const noSubscription = () => () => {};

export function wtfLink(sites: SiteSummary[]): string {
  const slugs = sites.map((s) => s.wtfSlug).filter(Boolean);
  return slugs.length ? `https://wheretofly.info/wtf.html?sites=${slugs.join("+")}` : WTF_HOME;
}

export function shareUrl(ids: string[], origin: string): string {
  return `${origin}${withBasePath("/my-sites/")}?sites=${encodeURIComponent(ids.join(","))}`;
}

function useAllSites(): SiteSummary[] | null | "failed" {
  const [all, setAll] = useState<SiteSummary[] | null | "failed">(null);
  useEffect(() => {
    fetch(withBasePath("/data/sites.json"))
      .then((r) =>
        r.ok ? (r.json() as Promise<SiteSummary[]>) : Promise.reject(new Error(String(r.status))),
      )
      .then(setAll)
      .catch(() => setAll("failed"));
  }, []);
  return all;
}

function Settings() {
  const { units, min, max } = useSettings();
  const toUnit = (kmh?: number) =>
    kmh === undefined ? "" : String(Math.round(units === "kt" ? kmh * KMH_TO_KT : kmh));
  const toKmh = (v: string) => {
    const n = Number(v);
    return v.trim() === "" || !Number.isFinite(n) ? undefined : units === "kt" ? n / KMH_TO_KT : n;
  };
  const unitLabel = units === "kt" ? "kt" : "km/h";
  return (
    <details className="rounded-[14px] border border-border bg-surface p-4">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
        {t("mySites.settings")}
      </summary>
      <fieldset className="mt-3">
        <legend className="text-[0.875rem] font-medium">{t("mySites.units")}</legend>
        <div className="mt-1 flex gap-4">
          {(["kmh", "kt"] as const).map((u) => (
            <label key={u} className="inline-flex min-h-11 items-center gap-2">
              <input type="radio" name="units" checked={units === u} onChange={() => setUnits(u)} />
              {u === "kt" ? t("mySites.knots") : "km/h"}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-3">
        <legend className="text-[0.875rem] font-medium">{t("mySites.limits")}</legend>
        <p className="text-[0.8125rem] text-muted">{t("mySites.limitsHelp")}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-[0.875rem]">
            {t("mySites.min", { unit: unitLabel })}
            <input
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={toUnit(min)}
              key={`min-${units}-${min}`}
              onBlur={(e) => setSpeedLimits({ min: toKmh(e.target.value), max })}
              className="min-h-11 w-28 rounded-[10px] border border-border-strong px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.875rem]">
            {t("mySites.max", { unit: unitLabel })}
            <input
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={toUnit(max)}
              key={`max-${units}-${max}`}
              onBlur={(e) => setSpeedLimits({ min, max: toKmh(e.target.value) })}
              className="min-h-11 w-28 rounded-[10px] border border-border-strong px-3"
            />
          </label>
        </div>
      </fieldset>
    </details>
  );
}

function ShareList({ ids }: { ids: string[] }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={async () => {
          const link = shareUrl(ids, window.location.origin);
          setUrl(link);
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-[10px] border border-border-strong bg-surface px-4 font-semibold"
      >
        <Share2 className="size-5" aria-hidden="true" />
        {t("mySites.share")}
      </button>
      {url && (
        <div className="flex flex-col gap-1">
          <label className="text-[0.875rem] font-medium" htmlFor="share-url">
            {copied ? (
              <span className="inline-flex items-center gap-1.5 text-link">
                <Check className="size-4" aria-hidden="true" />
                {t("mySites.copied")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Copy className="size-4" aria-hidden="true" />
                {t("mySites.copyThis")}
              </span>
            )}
          </label>
          <input
            id="share-url"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="min-h-11 w-full rounded-[10px] border border-border-strong px-3 text-[0.875rem]"
            data-testid="share-url"
          />
        </div>
      )}
    </div>
  );
}

function SharedListOffer({ ids, all }: { ids: string[]; all: SiteSummary[] }) {
  const sites = ids.map((id) => all.find((s) => s.id === id)).filter((s): s is SiteSummary => !!s);
  if (sites.length === 0) return null;
  const form = new Intl.PluralRules("en").select(sites.length) === "one" ? "one" : "other";
  return (
    <section
      aria-labelledby="shared"
      className="rounded-[14px] border-2 border-link bg-surface p-4"
      data-testid="shared-list"
    >
      <h2 id="shared" className="font-condensed text-[1.375rem] font-bold">
        {tOr(`mySites.sharedHeading.${form}`, "mySites.sharedHeading.other", {
          count: String(sites.length),
        })}
      </h2>
      <ul className="mt-1 list-disc pl-5">
        {sites.map((s) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          cacheSummaries(sites);
          addSites(sites.map((s) => s.id));
          window.history.replaceState(null, "", withBasePath("/my-sites/"));
        }}
        className="mt-3 inline-flex min-h-11 items-center rounded-[10px] bg-action px-4 font-semibold text-white"
      >
        {t("mySites.addShared")}
      </button>
    </section>
  );
}

export function MySitesDashboard({ sitesHref }: { sitesHref: string }) {
  const snapshot = useSyncExternalStore(subscribeMySites, mySitesSnapshot, () => "");
  const ids = useMemo(() => (snapshot ? snapshot.split("|") : []), [snapshot]);
  const all = useAllSites();
  // The share link's sites (?sites=…), read in the browser only.
  const sharedParam = useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(window.location.search).get("sites") ?? "",
    () => "",
  );
  const sharedIds = useMemo(() => sharedParam.split(",").filter(Boolean), [sharedParam]);
  // The local copy of saved sites, so the list shows without a connection (S1).
  const cache = useMemo(
    () => (snapshot && typeof window !== "undefined" ? readSummaryCache<SiteSummary>() : {}),
    [snapshot],
  );

  // Keep the local copy fresh whenever the full list is available.
  useEffect(() => {
    if (Array.isArray(all)) cacheSummaries(all.filter((s) => ids.includes(s.id)));
  }, [all, ids]);

  const lookup = (id: string) =>
    (Array.isArray(all) ? all.find((s) => s.id === id) : undefined) ?? cache[id];
  const saved = ids.map(lookup).filter((s): s is SiteSummary => !!s);
  const points = saved
    .filter((s) => s.exact && s.lat !== undefined && s.lon !== undefined)
    .map((s) => ({ id: s.id, lat: s.lat as number, lon: s.lon as number }));
  const state = useForecasts(points);
  const unsaved = sharedIds.filter((id) => !ids.includes(id));

  return (
    <div className="flex flex-col gap-4">
      {unsaved.length > 0 && Array.isArray(all) && <SharedListOffer ids={unsaved} all={all} />}

      {ids.length === 0 ? (
        <div
          className="rounded-[14px] border border-border bg-surface p-4 lg:p-5"
          data-testid="my-sites-empty"
        >
          <p>{t("mySites.empty")}</p>
          <Link
            href={sitesHref}
            className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
          >
            {t("mySites.browse")}
          </Link>
        </div>
      ) : saved.length === 0 ? (
        <p className="text-muted">
          {all === "failed" ? t("mySites.loadFailed") : t("mySites.loading")}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-3">
            <Anchor
              href={wtfLink(saved)}
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-ink px-4 font-semibold text-white no-underline hover:text-white"
            >
              {t("mySites.wtf")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </Anchor>
            <ShareList ids={ids} />
          </div>
          <OutlookLegend includeUnrated={saved.some((s) => !s.windParsed)} />
          <ul className="grid gap-3 lg:grid-cols-2" data-testid="my-sites-list">
            {saved.map((s) => (
              <SiteCard key={s.id} site={s}>
                <div className="mt-3">
                  {s.exact && s.lat !== undefined && s.lon !== undefined ? (
                    <SiteOutlook
                      point={{ id: s.id, lat: s.lat, lon: s.lon }}
                      ranges={s.windRanges}
                      rated={s.windParsed}
                      state={state}
                      compact
                      wtfHref={wtfLink([s])}
                    />
                  ) : (
                    <p className="text-[0.875rem] text-muted">{t("outlook.noPosition")}</p>
                  )}
                </div>
                {s.stations && s.stations.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {s.stations.map((st) => (
                      <li key={st.url}>
                        <Anchor
                          href={st.url}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-border-strong bg-surface px-3 text-[0.875rem] font-semibold text-ink no-underline hover:text-ink"
                        >
                          {st.name}
                          <ExternalLink className="size-4" aria-hidden="true" />
                        </Anchor>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => removeSites([s.id])}
                  className="mt-1 min-h-11 text-[0.875rem] font-semibold text-link underline underline-offset-4"
                >
                  {t("mySites.remove")}
                  <span className="sr-only">: {s.name}</span>
                </button>
              </SiteCard>
            ))}
          </ul>
        </>
      )}
      <Settings />
    </div>
  );
}
