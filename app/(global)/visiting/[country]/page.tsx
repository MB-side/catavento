import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OverviewMap } from "@/components/domain/OverviewMap";
import { TourList } from "@/components/domain/TourList";
import { VisitorHelpList } from "@/components/domain/VisitorHelpList";
import { VisitorRules } from "@/components/domain/VisitorRules";
import { card, h2, PageHeader } from "@/components/layout/PageHeader";
import { Anchor } from "@/components/ui/anchor";
import Link from "next/link";
import {
  getGuide,
  getOverviewRegion,
  getOverviewSites,
  getTourOperators,
  getVisitingCountries,
  getVisitorHelp,
} from "@/lib/data";
import { t } from "@/lib/messages";
import { isGroup, mapDataPath, worldPath } from "@/lib/overview";
import { pageMetadata } from "@/lib/seo";
import { visitingPath } from "@/lib/visiting";
import { countryLookups } from "@/lib/visiting-pages";

export const dynamicParams = false;

const overseas = () => getVisitingCountries().filter((c) => c.group !== "home");

export function generateStaticParams() {
  return overseas().map((c) => ({ country: c.code.toLowerCase() }));
}

async function lookup(params: Promise<{ country: string }>) {
  const { country } = await params;
  return overseas().find((c) => c.code === country.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const c = await lookup(params);
  if (!c) return {};
  return pageMetadata({
    title: t("visiting.countryTitle", { country: c.name }),
    description: t("visiting.countryIntro", { country: c.name }),
    path: visitingPath(c.code),
  });
}

/** Visiting one country outside Australia and New Zealand (D89). */
export default async function VisitingCountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const c = await lookup(params);
  if (!c) notFound();
  const region = getOverviewRegion(c.group);
  const guide = getGuide(c.code);
  const regionGuide = region && isGroup(region) ? getGuide(region.slug) : undefined;
  const worldHref = region
    ? `${worldPath(region, isGroup(region) ? c.code : undefined)}/`
    : undefined;
  const { names, pages } = countryLookups();
  const hasSites = region !== undefined && getOverviewSites(c.code).length > 0;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("visiting.countryTitle", { country: c.name })}
        intro={t("visiting.countryIntro", { country: c.name })}
        crumb={{ href: `${visitingPath()}/`, label: t("pages.visiting.title") }}
      />

      {hasSites && region && (
        <section aria-labelledby="map">
          <h2 id="map" className={h2}>
            {t("visiting.mapHeading")}
          </h2>
          <div className="mt-3">
            <OverviewMap
              dataPath={mapDataPath(region)}
              countryNames={{ [c.code]: c.name }}
              only={c.code}
            />
          </div>
          {worldHref && (
            <p className="mt-2">
              <Link href={worldHref}>{t("visiting.sitesWorld", { country: c.name })}</Link>
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="rules" className={card}>
        <h2 id="rules" className={h2}>
          {t("visiting.rulesHeading")}
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          <VisitorRules guide={guide} />
          {regionGuide && regionGuide.visitors.length > 0 && (
            <div>
              <h3 className="font-condensed text-[1.25rem] font-bold">{regionGuide.name}</h3>
              <VisitorRules guide={{ ...regionGuide, practice: undefined }} showBody={false} />
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="help">
        <h2 id="help" className={h2}>
          {t("visiting.helpHeading")}
        </h2>
        <p className="mt-1 text-muted">
          {t("visiting.helpIntro")} {t("visiting.notExhaustive")}
        </p>
        <div className="mt-3">
          <VisitorHelpList help={getVisitorHelp(c.code)} />
        </div>
      </section>

      <section aria-labelledby="tours">
        <h2 id="tours" className={h2}>
          {t("visiting.toursHeading")}
        </h2>
        <p className="mt-1 text-muted">
          {t("visiting.toursIntro")} {t("visiting.notExhaustive")}
        </p>
        <div className="mt-3">
          <TourList tours={getTourOperators(c.code)} names={names} pages={pages} />
        </div>
      </section>

      <section aria-labelledby="more" className={card}>
        <h2 id="more" className={h2}>
          {t("visiting.sitesContactsHeading")}
        </h2>
        <ul className="mt-2 flex flex-col gap-1">
          {worldHref && (
            <li>
              <Link href={worldHref}>{t("visiting.sitesWorld", { country: c.name })}</Link>
            </li>
          )}
          {guide?.links.map((l) => (
            <li key={l.url}>
              <Anchor href={l.url}>{l.label}</Anchor>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-[14px] bg-notice-tint p-4 text-notice-text">{t("site.disclaimer")}</p>
    </div>
  );
}
