"use client";

// An overview region's map (D83): loads the region's map file, so thousands of pins don't weigh
// down the page. The list below it works without JavaScript; the map is an extra.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { t } from "@/lib/messages";
import { mapSiteToSummary, type MapSite } from "@/lib/overview";
import { withBasePath } from "@/lib/paths";
import type { SiteSummary } from "@/lib/site-summary";

const SitesMap = dynamic(() => import("./SitesMap"), {
  ssr: false,
  loading: () => <p className="p-4 text-muted">{t("sitesList.mapLoading")}</p>,
});

export function OverviewMap({
  dataPath,
  countryNames,
  only,
}: {
  dataPath: string;
  countryNames: Record<string, string>;
  only?: string; // one country's pins, on its page
}) {
  const [sites, setSites] = useState<SiteSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(withBasePath(dataPath))
      .then((r) =>
        r.ok ? (r.json() as Promise<MapSite[]>) : Promise.reject(new Error(String(r.status))),
      )
      .then((rows) => {
        if (!live) return;
        setSites(
          rows
            .filter((m) => !only || m.c === only)
            .map((m) => mapSiteToSummary(m, countryNames[m.c] ?? m.c)),
        );
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [dataPath, countryNames, only]);

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
      {failed ? (
        <p className="p-4 text-muted">{t("sitesList.mapFailed")}</p>
      ) : sites ? (
        <SitesMap sites={sites} />
      ) : (
        <p className="p-4 text-muted">{t("sitesList.mapLoading")}</p>
      )}
    </div>
  );
}
