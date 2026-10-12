import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { SiteMapPanel } from "@/components/domain/SiteMapPanel";
import { StatusChip } from "@/components/domain/StatusChip";
import { StewardPanel } from "@/components/domain/StewardPanel";
import { WindRose } from "@/components/domain/WindRose";
import { WindyMap } from "@/components/domain/WindyMap";
import { ReportCorrectionLink } from "@/components/layout/ReportCorrectionLink";
import { getCountry, getEnabledCountries } from "@/lib/country";
import { getProvider, getSite, getSites } from "@/lib/data";
import { dateBlock, formatDate } from "@/lib/format";
import { windyEmbedUrl } from "@/lib/links";
import { t } from "@/lib/messages";
import { jsonLdScript, pageMetadata } from "@/lib/seo";
import { siteJsonLd } from "@/lib/site-jsonld";
import { siteShareImagePath } from "@/lib/share";
import { summarise } from "@/lib/site-summary";
import { siteView } from "@/lib/site-view";
import { mainLaunch, regionPath, regionSegmentOf, sitePath } from "@/lib/sites";
import type { Site } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return getEnabledCountries().flatMap((c) =>
    getSites(c.code).map((s) => ({
      country: c.code.toLowerCase(),
      region: regionSegmentOf(s.regionCode),
      slug: s.slug,
    })),
  );
}

async function load(params: PageProps<"/[country]/sites/[region]/[slug]">["params"]) {
  const { country: c, region, slug } = await params;
  const country = getCountry(c);
  if (!country) notFound();
  const site = getSite(`site:${country.code.toLowerCase()}:${region}:${slug}`);
  if (!site) notFound();
  return { country, site };
}

function describe(site: Site, regionName: string): string {
  return [
    regionName,
    site.typeText,
    site.windRangeLabel !== "See official details" ? site.windRangeLabel : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/sites/[region]/[slug]">): Promise<Metadata> {
  const { country, site } = await load(params);
  const regionName = country.regionNames[site.regionCode] ?? site.regionCode;
  return pageMetadata({
    title: site.name,
    description: describe(site, regionName),
    path: sitePath(site),
    image: { path: siteShareImagePath(site), alt: `${site.name}, ${regionName}` },
  });
}

const card = "rounded-[14px] border border-border bg-surface p-4 lg:p-5";
const h2 = "font-condensed text-[1.375rem] font-bold";

export default async function SitePage({ params }: PageProps<"/[country]/sites/[region]/[slug]">) {
  const { country, site } = await load(params);
  const zone = country.timezones[0] ?? "UTC";
  const today = new Date().toISOString().slice(0, 10);
  const view = siteView(site, today);
  const regionName = country.regionNames[site.regionCode] ?? site.regionCode;
  const launch = mainLaunch(site);
  const community = site.layer === "pge";
  const siteSource = site.sources[0];
  const sourceProvider = siteSource ? getProvider(siteSource.providerId) : undefined;
  const parsedWind = site.windRanges === "all" || site.windRanges.length > 0;
  const facts: [string, string | undefined][] = [
    [t("site.facts.type"), site.typeText],
    [t("site.facts.height"), site.heightText],
    [t("site.facts.rating"), site.ratingText],
    [t("site.facts.wind"), site.conditionsText ?? (parsedWind ? site.windRangeLabel : undefined)],
    [t("site.facts.launches"), site.launches.map((l) => l.name).join(", ") || undefined],
  ];
  const wtf = getProvider("wtf");
  const forecastLinks = [
    {
      label: t("site.forecasts.wtf"),
      href: site.wtfSlug ? `https://wheretofly.info/wtf.html?sites=${site.wtfSlug}` : wtf?.homepage,
    },
    { label: t("site.forecasts.skysight"), href: getProvider("skysight")?.homepage },
    { label: t("site.forecasts.pgmap"), href: getProvider("paraglidingmap")?.homepage },
  ].filter((l): l is { label: string; href: string } => !!l.href);

  return (
    <article className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd(site, regionName)) }}
      />

      <header>
        <nav aria-label={t("site.sitesCrumb")} className="text-[0.875rem] text-muted">
          <Link href={`/${country.code.toLowerCase()}/sites`}>{t("site.sitesCrumb")}</Link>
          {" › "}
          <Link href={regionPath(site.regionCode)}>{regionName}</Link>
        </nav>
        <h1 className="mt-1 font-condensed text-[2rem] leading-tight font-bold lg:text-[3rem]">
          {site.name}
        </h1>
        <p className="mt-1 text-[1.0625rem] text-muted-strong">{describe(site, regionName)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusChip status={site.status} />
          {site.ratingText && (
            <span className="rounded-full bg-ground px-2.5 py-0.5 text-[0.8125rem] font-semibold text-ink">
              {site.ratingText}
            </span>
          )}
          {community && (
            <span className="rounded-full bg-prototype-tint px-2.5 py-0.5 text-[0.8125rem] font-semibold text-prototype-text">
              {t("sitesList.community")}
            </span>
          )}
        </div>
        {site.officialGuideUrl && (
          <a
            href={site.officialGuideUrl}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-action px-4 font-semibold text-white no-underline hover:text-white"
          >
            {t("site.officialDetails")}
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </header>

      <StewardPanel
        site={site}
        country={country}
        steward={view.steward}
        listed={view.listed}
        also={view.also}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="wind" className={card}>
            <h2 id="wind" className={h2}>
              {t("site.wind.heading")}
            </h2>
            <div className="mt-3 flex items-center gap-4">
              <WindRose ranges={site.windRanges} size={160} labels />
              <div>
                {parsedWind ? (
                  <p className="font-condensed text-[1.375rem] font-bold">
                    {site.windRanges === "all"
                      ? t("site.wind.all")
                      : t("site.wind.published", { label: site.windRangeLabel })}
                  </p>
                ) : (
                  <p>{t("site.wind.unparsed")}</p>
                )}
                <p className="mt-1 text-[0.875rem] text-muted">
                  {community ? t("site.wind.community") : t("site.wind.note")}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="facts" className={card}>
            <h2 id="facts" className={h2}>
              {t("site.facts.heading")}
            </h2>
            <p className="mt-1 text-[0.9375rem] text-muted-strong">
              {community ? t("site.facts.communityNote") : t("site.facts.intro")}
            </p>
            <dl className="mt-3 grid gap-x-4 gap-y-2 text-[0.9375rem] sm:grid-cols-[9rem_1fr]">
              {facts.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-[0.8125rem] font-medium text-muted sm:pt-0.5">{label}</dt>
                  <dd>{value ?? t("site.facts.notPublished")}</dd>
                </div>
              ))}
            </dl>
            {site.officialGuideUrl && (
              <a
                href={site.officialGuideUrl}
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4"
              >
                {t("site.fullOfficialDetails")}
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            )}
            {siteSource && (
              <p className="mt-2 text-[0.8125rem] text-muted">
                {community
                  ? t("site.facts.communitySource", {
                      date: formatDate(siteSource.fetchedAt, zone),
                    })
                  : t("site.facts.source", {
                      provider: sourceProvider?.name ?? siteSource.providerId,
                      date: formatDate(siteSource.fetchedAt, zone),
                    })}
                {" · "}
                <ReportCorrectionLink recordId={site.id} className="underline underline-offset-4" />
              </p>
            )}
          </section>

          <section aria-labelledby="stations" className={card}>
            <h2 id="stations" className={h2}>
              {t("site.stations.heading")}
            </h2>
            {view.stations.length === 0 ? (
              <p className="mt-2 text-muted">{t("site.stations.none")}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {view.stations.map(({ station, provider, km }) => (
                  <li
                    key={station.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-ground p-3"
                  >
                    <div>
                      <p className="font-semibold">{station.name}</p>
                      <p className="text-[0.875rem] text-muted">
                        {[
                          provider?.name,
                          station.ownerLabel === "club station"
                            ? t("site.stations.clubStation")
                            : undefined,
                          km === undefined
                            ? undefined
                            : km <= 0.2
                              ? t("site.stations.onSite")
                              : t("site.stations.away", { distance: km.toFixed(1) }),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <a
                      href={station.url}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-border-strong bg-surface px-3 font-semibold text-ink no-underline hover:text-ink"
                    >
                      {t("site.stations.open")}
                      <span className="sr-only">: {station.name}</span>
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[0.875rem] text-muted">{t("liveWind.stationsText")}</p>
          </section>

          <section aria-labelledby="forecasts" className={card}>
            <h2 id="forecasts" className={h2}>
              {t("site.forecasts.heading")}
            </h2>
            <p className="mt-1">{t("site.forecasts.intro")}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {forecastLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-border-strong bg-surface px-3 font-semibold text-ink no-underline hover:text-ink"
                  >
                    {l.label}
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {(view.steward ?? view.listed) && (
            <section aria-labelledby="news" className={card}>
              <h2 id="news" className={h2}>
                {t("site.notices.heading")}
              </h2>
              {view.notices.length === 0 ? (
                <p className="mt-2 text-muted">{t("site.notices.none")}</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1">
                  {view.notices.map((n) => (
                    <li key={n.id}>
                      <a href={n.url}>{n.title}</a>{" "}
                      <span className="text-[0.875rem] text-muted">
                        · {formatDate(n.date, zone)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section aria-labelledby="new-to-flying" className={card}>
            <h2 id="new-to-flying" className={h2}>
              {t("site.nearby.schoolsHeading")}
            </h2>
            {view.schools.length === 0 ? (
              <p className="mt-2 text-muted">
                {t("site.nearby.noSchools", { region: regionName })}
              </p>
            ) : (
              <>
                <p className="mt-1 text-muted-strong">
                  {t("site.nearby.schoolsIntro", { region: regionName })}
                </p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {view.schools.map((o) => (
                    <li key={o.id}>{o.website ? <a href={o.website}>{o.name}</a> : o.name}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="events" className={card}>
            <h2 id="events" className={h2}>
              {t("site.nearby.eventsHeading", { region: regionName })}
            </h2>
            {view.events.length === 0 ? (
              <p className="mt-2 text-muted">{t("site.nearby.noEvents", { region: regionName })}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {view.events.map((e) => {
                  const d = dateBlock(e.startDate, zone);
                  return (
                    <li key={e.id} className="flex items-center gap-3">
                      <span className="flex w-12 shrink-0 flex-col items-center rounded-[8px] bg-info-tint py-1 font-condensed leading-none font-bold text-link">
                        <span className="text-[0.75rem]">{d.month}</span>
                        <span className="text-[1.375rem]">{d.day}</span>
                      </span>
                      <span>
                        <a href={e.url} className="font-semibold">
                          {e.title}
                        </a>
                        {e.locationText && (
                          <span className="block text-[0.875rem] text-muted">{e.locationText}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {view.steward && view.otherSites.length > 0 && (
            <section aria-labelledby="other-sites" className={card}>
              <h2 id="other-sites" className={h2}>
                {t("site.otherSites.heading", { name: view.steward.name })}
              </h2>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {view.otherSites.map((s) => (
                  <li key={s.id}>
                    <Link href={sitePath(s)}>{s.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="where" className={card}>
            <h2 id="where" className={h2}>
              {t("site.map.heading")}
            </h2>
            {launch ? (
              <>
                <p className="mt-2 font-condensed text-[1.125rem]">
                  {launch.lat.toFixed(4)}, {launch.lon.toFixed(4)}
                </p>
                <SiteMapPanel
                  site={summarise(site, regionName, {
                    steward: view.steward?.name,
                    contact: view.listed?.name ?? site.listedContact?.name,
                  })}
                />
              </>
            ) : (
              <p className="mt-2 text-muted">{t("site.map.noPosition")}</p>
            )}
          </section>
          {launch && (
            <section aria-labelledby="live-wind">
              <h2 id="live-wind" className={`${h2} mb-2`}>
                {t("liveWind.heading")}
              </h2>
              <WindyMap
                src={windyEmbedUrl({
                  lat: launch.lat,
                  lon: launch.lon,
                  zoom: 10,
                  speedUnit: country.defaultUnits.speed,
                })}
                placeName={site.name}
              />
            </section>
          )}
        </aside>
      </div>

      <p className="rounded-[14px] bg-info-tint p-4 text-[0.9375rem] text-muted-strong">
        {t("site.disclaimer")}
      </p>

      <footer aria-labelledby="sources" className="text-[0.875rem] text-muted">
        <h2 id="sources" className="font-semibold text-muted-strong">
          {t("site.sources.heading")}
        </h2>
        <ul className="mt-1 flex flex-col gap-0.5">
          {[...new Map(site.sources.map((s) => [s.providerId, s])).values()].map((s) => {
            const p = getProvider(s.providerId);
            const orgName = view.steward?.name ?? view.listed?.name;
            const credit = p?.attribution.replace("{club name}", orgName ?? p.name);
            return (
              <li key={s.providerId}>
                <a href={s.url}>{credit ?? s.providerId}</a> · {formatDate(s.fetchedAt, zone)}
              </li>
            );
          })}
        </ul>
      </footer>
    </article>
  );
}
