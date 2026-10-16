"use client";

// The site map on a visiting page (D90): shown straight away, because pilots look for the map first.
// The map code loads in the browser only (docs/02 §7).
import dynamic from "next/dynamic";
import { t } from "@/lib/messages";
import type { SiteSummary } from "@/lib/site-summary";

const SitesMap = dynamic(() => import("./SitesMap"), {
  ssr: false,
  loading: () => <p className="p-4 text-muted">{t("sitesList.mapLoading")}</p>,
});

export function CountrySitesMap({ sites }: { sites: SiteSummary[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border" data-testid="visiting-map">
      <SitesMap sites={sites} />
    </div>
  );
}
