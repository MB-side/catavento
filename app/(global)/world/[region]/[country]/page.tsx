import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { t } from "@/lib/messages";
import { isGroup, mapDataPath, worldPath } from "@/lib/overview";
import { pageMetadata } from "@/lib/seo";
import { visitingPath } from "@/lib/visiting";
import { hasVisitingPage } from "@/lib/visiting-pages";
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return getOverviewRegions()
    .filter(isGroup)
    .flatMap((r) => r.countries.map((c) => ({ region: r.slug, country: c.code.toLowerCase() })));
}

async function lookup(params: Promise<{ region: string; country: string }>) {
  const p = await params;
  const region = getOverviewRegion(p.region);
  const country = region?.countries.find((c) => c.code === p.country.toUpperCase());
  return region && country && isGroup(region) ? { region, country } : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; country: string }>;
}): Promise<Metadata> {
  const found = await lookup(params);
  if (!found) return {};
  return pageMetadata({
    title: t("world.regionTitle", { name: found.country.name }),
    description: t("world.regionSummary", { name: found.country.name }),
    path: worldPath(found.region, found.country.code),
  });
}

const h2 = "font-condensed text-[1.5rem] font-bold";

/** One country in an overview group, e.g. France in Europe (D83): guide, map and site list. */
export default async function OverviewCountryPage({
  params,
}: {
  params: Promise<{ region: string; country: string }>;
}) {
  const found = await lookup(params);
  if (!found) notFound();
  const { region, country } = found;
  const sites = getOverviewSites(country.code);
  const checked = sites.reduce((d, s) => (s.fetchedAt > d ? s.fetchedAt : d), "");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={country.name}
        crumb={{ href: worldPath(region), label: region.name }}
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
          <OverviewGuide guide={getGuide(country.code)} name={country.name} />
        </div>
      </section>

      {hasVisitingPage(country.code) && (
        <p>
          <Link href={`${visitingPath(country.code)}/`} className="font-semibold">
            {t("visiting.fromWorld", { country: country.name })}
          </Link>
        </p>
      )}

      <p className="rounded-[14px] bg-notice-tint p-4 text-notice-text">{t("site.disclaimer")}</p>

      <section aria-labelledby="sites">
        <h2 id="sites" className={h2}>
          {t("world.sitesHeading")}
        </h2>
        <p className="mt-1 text-muted">{t("world.sitesNote")}</p>
        {sites.length > 0 ? (
          <>
            <div className="mt-3">
              <OverviewMap
                dataPath={mapDataPath(region)}
                countryNames={{ [country.code]: country.name }}
                only={country.code}
              />
            </div>
            <div className="mt-4">
              <OverviewSiteList sites={sites} dataPath={mapDataPath(region)} />
            </div>
          </>
        ) : (
          <p className="mt-3 text-muted">{t("world.sitesNone", { country: country.name })}</p>
        )}
      </section>

      {checked && (
        <p className="text-[0.875rem] text-muted">
          {getProvider("pge")?.attribution} ·{" "}
          {t("world.checked", { date: formatDate(checked, "UTC") })}
        </p>
      )}
    </div>
  );
}
