import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { OverviewGuide } from "@/components/domain/OverviewGuide";
import { OverviewMap } from "@/components/domain/OverviewMap";
import { OverviewSiteList } from "@/components/domain/OverviewSiteList";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getGuide,
  getOverviewRegion,
  getOverviewRegions,
  getOverviewSites,
  getProvider,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { t, tCount } from "@/lib/messages";
import { isGroup, mapDataPath, worldPath } from "@/lib/overview";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getOverviewRegions().map((r) => ({ region: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const region = getOverviewRegion((await params).region);
  if (!region) return {};
  return pageMetadata({
    title: t("world.regionTitle", { name: region.name }),
    description: t("world.regionSummary", { name: region.name }),
    path: worldPath(region),
  });
}

const h2 = "font-condensed text-[1.5rem] font-bold";

/** An overview region (D83): Europe with its countries, or a destination with its sites. */
export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const region = getOverviewRegion((await params).region);
  if (!region) notFound();
  const group = isGroup(region);
  const only = group ? undefined : region.countries[0];
  const guide = getGuide(group ? region.slug : (only?.code ?? ""));
  const codes = new Set(region.countries.map((c) => c.code));
  const sites = getOverviewSites().filter((s) => codes.has(s.country));
  const names = Object.fromEntries(region.countries.map((c) => [c.code, c.name]));
  const checked = sites.reduce((d, s) => (s.fetchedAt > d ? s.fetchedAt : d), "");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={region.name}
        crumb={{ href: "/world", label: t("pages.world.title") }}
        intro={t("world.overviewIntro")}
      >
        <p className="mt-2">
          <span className="rounded-full bg-info-tint px-2.5 py-0.5 text-[0.8125rem] font-semibold text-link">
            {t("world.overviewLabel")}
          </span>
        </p>
      </PageHeader>

      <section
        aria-labelledby="guide"
        className="rounded-[14px] border border-border bg-surface p-4 lg:p-6"
      >
        <h2 id="guide" className={h2}>
          {t("world.guideHeading")}
        </h2>
        <div className="mt-3">
          <OverviewGuide guide={guide} name={region.name} />
        </div>
      </section>

      <p className="rounded-[14px] bg-notice-tint p-4 text-notice-text">{t("site.disclaimer")}</p>

      <section aria-labelledby="map">
        <h2 id="map" className={h2}>
          {t("world.mapHeading")}
        </h2>
        <p className="mt-1 text-muted">{t("world.sitesNote")}</p>
        <div className="mt-3">
          <OverviewMap dataPath={mapDataPath(region)} countryNames={names} />
        </div>
      </section>

      {group ? (
        <section aria-labelledby="countries">
          <h2 id="countries" className={h2}>
            {t("world.countriesHeading")}
          </h2>
          <ul
            className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="world-countries"
          >
            {region.countries.map((c) => {
              const n = sites.filter((s) => s.country === c.code).length;
              const body = getGuide(c.code)?.nationalBody;
              return (
                <li key={c.code}>
                  <Link
                    href={`${worldPath(region, c.code)}/`}
                    className="flex h-full min-h-11 items-center justify-between gap-3 rounded-[14px] border border-border bg-surface p-4 text-ink hover:border-link hover:text-ink"
                  >
                    <span>
                      <span className="block font-condensed text-[1.125rem] font-bold">
                        {c.name}
                      </span>
                      <span className="block text-[0.875rem] text-muted">
                        {[body?.name, n > 0 ? tCount("counts.sites", n) : undefined]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-action" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="sites">
          <h2 id="sites" className={h2}>
            {t("world.sitesHeading")}
          </h2>
          <div className="mt-3">
            {sites.length > 0 ? (
              <OverviewSiteList sites={sites} dataPath={mapDataPath(region)} />
            ) : (
              <p className="text-muted">{t("world.sitesNone", { country: region.name })}</p>
            )}
          </div>
        </section>
      )}

      {checked && (
        <p className="text-[0.875rem] text-muted">
          {getProvider("pge")?.attribution} ·{" "}
          {t("world.checked", { date: formatDate(checked, "UTC") })}
        </p>
      )}
    </div>
  );
}
