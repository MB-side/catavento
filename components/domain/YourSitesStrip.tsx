"use client";

// "Your sites" at the top of the home page for visitors with saved sites (D37): up to four saved
// sites with their outlook strip, and a link to My Sites. Nothing shows for new visitors.
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { OutlookLegend, SiteOutlook, useForecasts } from "@/components/domain/Outlook";
import { t } from "@/lib/messages";
import { mySitesSnapshot, readSummaryCache, subscribeMySites } from "@/lib/my-sites";
import type { SiteSummary } from "@/lib/site-summary";

const SHOWN = 4;

export function YourSitesStrip() {
  const snapshot = useSyncExternalStore(subscribeMySites, mySitesSnapshot, () => "");
  const sites = useMemo(() => {
    if (!snapshot || typeof window === "undefined") return [];
    const cache = readSummaryCache<SiteSummary>();
    return snapshot
      .split("|")
      .map((id) => cache[id])
      .filter((s): s is SiteSummary => !!s)
      .slice(0, SHOWN);
  }, [snapshot]);
  const points = sites
    .filter((s) => s.exact && s.lat !== undefined && s.lon !== undefined)
    .map((s) => ({ id: s.id, lat: s.lat as number, lon: s.lon as number }));
  const state = useForecasts(points);
  if (sites.length === 0) return null;

  return (
    <section aria-labelledby="your-sites" className="flex flex-col gap-3" data-testid="your-sites">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="your-sites" className="font-condensed text-[1.5rem] font-bold">
          {t("home.yourSites")}
        </h2>
        <Link href="/my-sites" className="font-semibold">
          {t("home.openMySites")}
        </Link>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {sites.map((s) => (
          <li key={s.id} className="rounded-[14px] border border-border bg-surface p-4">
            <Link href={s.href} className="font-condensed text-[1.25rem] font-bold">
              {s.name}
            </Link>
            <p className="text-[0.875rem] text-muted">
              {[s.regionName, s.windParsed ? s.windLabel : undefined].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-2">
              {s.exact && s.lat !== undefined && s.lon !== undefined ? (
                <SiteOutlook
                  point={{ id: s.id, lat: s.lat, lon: s.lon }}
                  ranges={s.windRanges}
                  marginal={s.windMarginal}
                  rated={s.windParsed}
                  state={state}
                  compact
                  wtfHref="https://wheretofly.info/"
                />
              ) : (
                <p className="text-[0.875rem] text-muted">{t("outlook.noPosition")}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <OutlookLegend includeUnrated={sites.some((s) => !s.windParsed)} />
    </section>
  );
}
