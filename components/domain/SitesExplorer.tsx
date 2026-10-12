"use client";

// Sites list with filters (docs/02 §5.5). The list is the main interface and works without
// JavaScript (it is pre-rendered in full); the map is an extra that loads only when asked for.
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import { SiteCard } from "@/components/domain/SiteCard";
import { t, tOr } from "@/lib/messages";
import type { SiteSummary } from "@/lib/site-summary";
import { COMPASS_POINTS, takesWindFrom } from "@/lib/wind";

const SitesMap = dynamic(() => import("./SitesMap"), {
  ssr: false,
  loading: () => <p className="p-4 text-muted">{t("sitesList.mapLoading")}</p>,
});

interface Props {
  sites: SiteSummary[];
  regions?: { code: string; name: string }[]; // omitted on a region page
  regionLabel: string;
}

const control =
  "min-h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-[1rem] text-ink";
const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function SitesExplorer({ sites, regions, regionLabel }: Props) {
  const [text, setText] = useState("");
  const [region, setRegion] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [wind, setWind] = useState("");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const shown = useMemo(() => {
    const q = fold(text.trim());
    const bearing = wind ? COMPASS_POINTS.indexOf(wind) * 22.5 : undefined;
    return sites.filter(
      (s) =>
        (!q || fold(s.name).includes(q)) &&
        (!region || s.regionCode === region) &&
        (!discipline || s.disciplines.includes(discipline as "PG" | "HG")) &&
        (bearing === undefined || (s.windParsed && takesWindFrom(s.windRanges, bearing))) &&
        (!officialOnly || !s.community),
    );
  }, [sites, text, region, discipline, wind, officialOnly]);

  const filtered = text || region || discipline || wind || officialOnly;
  const plural = new Intl.PluralRules("en").select(shown.length) === "one" ? "one" : "other";

  return (
    <div className="flex flex-col gap-4">
      <form
        role="search"
        aria-label={t("sitesList.filtersHeading")}
        className="grid gap-3 rounded-[14px] border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
          {t("sitesList.name")}
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("sitesList.namePlaceholder")}
            className={control}
          />
        </label>
        {regions && (
          <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
            {regionLabel}
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={control}>
              <option value="">{t("sitesList.allRegions")}</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
          {t("sitesList.discipline")}
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className={control}
          >
            <option value="">{t("sitesList.anyDiscipline")}</option>
            <option value="PG">{t("sitesList.pg")}</option>
            <option value="HG">{t("sitesList.hg")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
          {t("sitesList.wind")}
          <select value={wind} onChange={(e) => setWind(e.target.value)} className={control}>
            <option value="">{t("sitesList.anyWind")}</option>
            {COMPASS_POINTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
          {t("sitesList.include")}
          <select
            value={officialOnly ? "official" : ""}
            onChange={(e) => setOfficialOnly(e.target.value === "official")}
            className={control}
          >
            <option value="">{t("sitesList.includeAll")}</option>
            <option value="official">{t("sitesList.includeOfficial")}</option>
          </select>
        </label>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="font-semibold" data-testid="site-count">
          {tOr(`sitesList.results.${plural}`, "sitesList.results.other", {
            count: String(shown.length),
          })}
        </p>
        <div className="flex gap-2">
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setText("");
                setRegion("");
                setDiscipline("");
                setWind("");
                setOfficialOnly(false);
              }}
              className="min-h-11 rounded-[10px] px-3 font-semibold text-link underline underline-offset-4"
            >
              {t("sitesList.clear")}
            </button>
          )}
          <button
            type="button"
            aria-expanded={showMap}
            onClick={() => setShowMap((v) => !v)}
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-border-strong bg-surface px-4 font-semibold"
          >
            <MapIcon className="size-5" aria-hidden="true" />
            {showMap ? t("sitesList.hideMap") : t("sitesList.showMap")}
          </button>
        </div>
      </div>

      {showMap && (
        <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
          <SitesMap sites={shown} />
        </div>
      )}

      {shown.length === 0 ? (
        <p className="rounded-[14px] border border-border bg-surface p-4">
          {t("sitesList.noResults")}
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="site-list">
          {shown.map((s) => (
            <SiteCard key={s.id} site={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
