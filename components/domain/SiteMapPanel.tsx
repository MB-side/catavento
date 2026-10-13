"use client";

// "Where it is" on a site page: the launch position, and the map on request (map code loads only
// when asked for, docs/02 §7).
import dynamic from "next/dynamic";
import { useState } from "react";
import { Map as MapIcon } from "lucide-react";
import { t } from "@/lib/messages";
import type { SiteSummary } from "@/lib/site-summary";
import type { MapPoint } from "./SitesMap";

const SitesMap = dynamic(() => import("./SitesMap"), {
  ssr: false,
  loading: () => <p className="p-4 text-muted">{t("sitesList.mapLoading")}</p>,
});

export function SiteMapPanel({ site, points = [] }: { site: SiteSummary; points?: MapPoint[] }) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={shown}
        onClick={() => setShown((v) => !v)}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-border-strong bg-surface px-4 font-semibold"
      >
        <MapIcon className="size-5" aria-hidden="true" />
        {shown ? t("sitesList.hideMap") : t("site.map.show")}
      </button>
      {shown && (
        <div className="mt-3 overflow-hidden rounded-[10px] border border-border">
          <SitesMap sites={[site]} points={points} />
        </div>
      )}
    </div>
  );
}
