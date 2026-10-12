import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SitesExplorer } from "@/components/domain/SitesExplorer";
import { getCountry, getEnabledCountries } from "@/lib/country";
import { getSites } from "@/lib/data";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { siteSummaries } from "@/lib/site-view";
import { regionPath, regionSegmentOf } from "@/lib/sites";

export const dynamicParams = false;

/** One page per region that has at least one site. */
export function generateStaticParams() {
  return getEnabledCountries().flatMap((c) =>
    [...new Set(getSites(c.code).map((s) => s.regionCode))].map((code) => ({
      country: c.code.toLowerCase(),
      region: regionSegmentOf(code),
    })),
  );
}

async function load(params: PageProps<"/[country]/sites/[region]">["params"]) {
  const { country: c, region } = await params;
  const country = getCountry(c);
  const regionCode = country?.regions.find((r) => regionSegmentOf(r) === region);
  if (!country || !regionCode) notFound();
  return { country, regionCode, regionName: country.regionNames[regionCode] ?? regionCode };
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/sites/[region]">): Promise<Metadata> {
  const { regionCode, regionName } = await load(params);
  return pageMetadata({
    title: `${t("pages.sites.title")} · ${regionName}`,
    description: t("sitesList.regionIntro", { region: regionName }),
    path: regionPath(regionCode),
  });
}

export default async function RegionSitesPage({ params }: PageProps<"/[country]/sites/[region]">) {
  const { country, regionCode, regionName } = await load(params);
  const sites = siteSummaries(country, regionCode);
  const hasCommunity = sites.some((s) => s.community);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label={t("site.sitesCrumb")} className="text-[0.875rem] text-muted">
          <Link href={`/${country.code.toLowerCase()}/sites`}>
            {t("site.sitesCrumb")} · {country.name}
          </Link>
        </nav>
        <h1 className="mt-1 font-condensed text-[2rem] leading-tight font-bold">{regionName}</h1>
        <p className="mt-2 text-[1.0625rem]">
          {t("sitesList.regionIntro", { region: regionName })}
        </p>
      </header>
      {hasCommunity && (
        <p className="text-[0.9375rem] text-muted-strong">{t("sitesList.communityExplainer")}</p>
      )}
      <SitesExplorer sites={sites} regionLabel={country.regionLabel} />
    </div>
  );
}
