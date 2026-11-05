// One page per country (D93): the same eight sections in the same order everywhere. Australia and New
// Zealand fill them from the directory; other countries from their guide, the visiting-pilot data and
// ParaglidingEarth, with a pointer to the best source where we hold nothing yet.
import Link from "next/link";
import { CountrySitesMap } from "@/components/domain/CountrySitesMap";
import { OverviewMap } from "@/components/domain/OverviewMap";
import { OverviewSiteList } from "@/components/domain/OverviewSiteList";
import { TourList } from "@/components/domain/TourList";
import { VisitorHelpList } from "@/components/domain/VisitorHelpList";
import { VisitorRules } from "@/components/domain/VisitorRules";
import { CountryCountsLine, LiveWind } from "@/components/layout/CountryPage";
import { card, h2, PageHeader } from "@/components/layout/PageHeader";
import { Anchor } from "@/components/ui/anchor";
import { orgPath } from "@/lib/clubs";
import type { CountryProfile } from "@/lib/country-profile";
import {
  getBrands,
  getCounts,
  getGuide,
  getOrganisation,
  getOverviewSites,
  getProvider,
  getTourOperators,
  getVisitorHelp,
} from "@/lib/data";
import { eventSummary, nationalNotices, upcomingEvents } from "@/lib/events-view";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/messages";
import { isGroup, mapDataPath } from "@/lib/overview";
import { siteSummaries } from "@/lib/site-view";
import { countryLookups } from "@/lib/visiting-pages";
import { CoverageBadge } from "./CoverageBadge";

const sectionIds = [
  "map",
  "rules",
  "contacts",
  "learn",
  "tours",
  "gear",
  "events",
  "more",
] as const;
type SectionId = (typeof sectionIds)[number];

function Section({ id, children }: { id: SectionId; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`h-${id}`} id={id} className={`${card} scroll-mt-24`}>
      <h2 id={`h-${id}`} className={`${h2} flex items-baseline gap-2`}>
        <span className="text-action" aria-hidden="true">
          {sectionIds.indexOf(id) + 1}
        </span>
        {t(`countryPage.sections.${id}`)}
      </h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Pointer({ children }: { children: React.ReactNode }) {
  return <p className="border-l-[3px] border-border pl-3 text-muted-strong">{children}</p>;
}

const linkFor = (links: { label: string; url: string }[], pattern: RegExp) =>
  links.find((l) => pattern.test(l.label));

export function CountryProfilePage({ profile }: { profile: CountryProfile }) {
  const { code, name, country, region, guide } = profile;
  const seg = `/${code.toLowerCase()}`;
  const counts = country ? getCounts(code) : undefined;
  const regionGuide = region && isGroup(region) ? getGuide(region.slug) : undefined;
  const overviewSites = country ? [] : getOverviewSites(code);
  const help = getVisitorHelp(code);
  const orgHrefs = Object.fromEntries(
    help.flatMap((h) => {
      const org = h.orgId ? getOrganisation(h.orgId) : undefined;
      return org ? [[org.id, `${orgPath(org)}/`]] : [];
    }),
  );
  const { names, pages } = countryLookups();
  const body = country?.nationalBody ?? guide?.nationalBody;
  const links = [...(guide?.links ?? []), ...(regionGuide?.links ?? [])].filter(
    (l, i, all) => all.findIndex((x) => x.url === l.url) === i,
  );
  const today = new Date().toISOString().slice(0, 10);
  const events = country
    ? upcomingEvents(country, today)
        .slice(0, 3)
        .map((e) => eventSummary(e, country))
    : [];
  const notices = country ? nationalNotices(country).slice(0, 3) : [];
  const zone = country?.timezones[0] ?? "UTC";
  const pge = `https://www.paraglidingearth.com/?country=${code.toLowerCase()}`;

  return (
    <div className="flex flex-col gap-5" data-testid="country-page">
      <PageHeader title={t("countryPage.title", { country: name })} intro={t("countryPage.intro")}>
        <p className="mt-2 flex flex-wrap items-center gap-2">
          <CoverageBadge coverage={profile.coverage} />
          {body && (
            <span className="text-muted-strong">
              {t("world.nationalBody")}: <Anchor href={body.url}>{body.name}</Anchor>
            </span>
          )}
        </p>
        {country && <CountryCountsLine code={code} />}
      </PageHeader>

      <Section id="map">
        {country ? (
          <>
            <CountrySitesMap sites={siteSummaries(country)} />
            <p>
              <Link href={`${seg}/sites/`}>
                {t("countryPage.allSites", { count: String(counts?.sites ?? 0) })}
              </Link>
            </p>
          </>
        ) : overviewSites.length > 0 && region ? (
          <>
            <OverviewMap
              dataPath={mapDataPath(region)}
              countryNames={{ [code]: name }}
              only={code}
            />
            <p>
              <a href="#site-list">
                {t("countryPage.siteListLink", { count: String(overviewSites.length) })}
              </a>
            </p>
          </>
        ) : (
          <Pointer>
            {t("countryPage.noSites")} <Anchor href={pge}>ParaglidingEarth</Anchor>
          </Pointer>
        )}
      </Section>

      <Section id="rules">
        <VisitorRules guide={guide} showBody={false} showPractice={false} />
        {regionGuide && regionGuide.visitors.length > 0 && (
          <div>
            <h3 className="font-condensed text-[1.25rem] font-bold">{regionGuide.name}</h3>
            <VisitorRules guide={{ ...regionGuide, practice: undefined }} showBody={false} />
          </div>
        )}
        {country && (
          <p>
            <Link href={`${seg}/visiting-pilots/`}>{t("countryPage.visitorGuide")}</Link>
          </p>
        )}
      </Section>

      <Section id="contacts">
        {country ? (
          <>
            <p>
              {t("countryPage.clubsLine", { count: String(counts?.clubs ?? 0), country: name })}
            </p>
            <p>
              <Link href={`${seg}/clubs/`}>{t("countryPage.findClub")}</Link>
            </p>
          </>
        ) : (
          <Pointer>
            {t("countryPage.contactsPointer", { country: name })}{" "}
            {(() => {
              const club = linkFor(links, /club/i);
              if (club) return <Anchor href={club.url}>{club.label}</Anchor>;
              if (body) return t("countryPage.askBody", { body: body.name });
              return null;
            })()}
          </Pointer>
        )}
        {guide?.practice && guide.practice.length > 0 && (
          <ul className="list-disc space-y-1 pl-5">
            {guide.practice.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="learn">
        {country ? (
          <>
            <p>
              {t("countryPage.learnLine", { schools: String(counts?.schools ?? 0), country: name })}
            </p>
            <p>
              <Link href={`${seg}/new-to-flying/`}>{t("countryPage.learnLinks")}</Link>
            </p>
          </>
        ) : (
          guide &&
          guide.learners.length > 0 && (
            <div>
              <h3 className="font-condensed text-[1.25rem] font-bold">
                {t("countryPage.learnersHeading")}
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {guide.learners.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )
        )}
        <div>
          <h3 className="font-condensed text-[1.25rem] font-bold">
            {t("countryPage.helpHeading")}
          </h3>
          <p className="mt-1 text-muted">
            {t("visiting.helpIntro")} {t("visiting.notExhaustive")}
          </p>
          <div className="mt-3">
            <VisitorHelpList help={help} orgHrefs={orgHrefs} />
          </div>
        </div>
        {!country &&
          (() => {
            const school = linkFor(links, /school|école|ecole|flugschul|scuol/i);
            return school ? (
              <Pointer>
                <Anchor href={school.url}>{school.label}</Anchor>
              </Pointer>
            ) : null;
          })()}
      </Section>

      <Section id="tours">
        <p className="text-muted">
          {t("visiting.toursIntro")} {t("visiting.notExhaustive")}
        </p>
        <TourList tours={getTourOperators(code)} names={names} pages={pages} />
      </Section>

      <Section id="gear">
        {country && (counts?.gear ?? 0) > 0 ? (
          <>
            <p>{t("countryPage.gearLine")}</p>
            <p className="flex flex-wrap gap-x-3">
              <Link href={`${seg}/gear/shops/`}>{t("countryPage.gearShops")}</Link>
              <Link href={`${seg}/gear/where-to-buy/`}>{t("countryPage.gearWhere")}</Link>
              <Link href={`${seg}/gear/used/`}>{t("countryPage.gearUsed")}</Link>
            </p>
          </>
        ) : (
          <>
            <Pointer>{t("countryPage.gearPointer", { country: name })}</Pointer>
            <ul className="flex flex-wrap gap-x-3 gap-y-1" data-testid="dealer-lists">
              {getBrands()
                .filter((b) => b.dealerPage)
                .map((b) => (
                  <li key={b.id}>
                    <Anchor href={b.dealerPage?.url}>{b.name}</Anchor>
                  </li>
                ))}
            </ul>
          </>
        )}
      </Section>

      <Section id="events">
        {country ? (
          <>
            {events.length > 0 && (
              <ul className="flex flex-col gap-1">
                {events.map((e) => (
                  <li key={e.id}>
                    <Anchor href={e.url}>{e.title}</Anchor>{" "}
                    <span className="text-[0.875rem] text-muted">· {e.when}</span>
                  </li>
                ))}
              </ul>
            )}
            {notices.length > 0 && (
              <ul className="flex flex-col gap-1">
                {notices.map((n) => (
                  <li key={n.id}>
                    <Anchor href={n.url}>{n.title}</Anchor>{" "}
                    <span className="text-[0.875rem] text-muted">· {formatDate(n.date, zone)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p>
              <Link href={`${seg}/whats-on/`}>
                {t("countryPage.eventsLink", { country: name })}
              </Link>
            </p>
          </>
        ) : (
          <Pointer>
            {t("countryPage.eventsPointer", { country: name })}{" "}
            {body && (
              <>
                <Anchor href={body.url}>{body.name}</Anchor>
              </>
            )}
          </Pointer>
        )}
      </Section>

      <Section id="more">
        {country && (
          <p>{t("countryPage.weatherLine", { stations: String(counts?.stations ?? 0) })}</p>
        )}
        {country && <LiveWind country={country} />}
        {links.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.url}>
                <Anchor href={l.url}>{l.label}</Anchor>
              </li>
            ))}
          </ul>
        ) : (
          !country && (
            <Pointer>
              <Anchor href={pge}>{t("countryPage.morePointer", { country: name })}</Anchor>
            </Pointer>
          )
        )}
      </Section>

      <p className="rounded-[14px] bg-notice-tint p-4 text-notice-text">{t("site.disclaimer")}</p>

      {overviewSites.length > 0 && region && (
        <section aria-labelledby="h-site-list" id="site-list" className="scroll-mt-24">
          <h2 id="h-site-list" className={h2}>
            {t("countryPage.siteListHeading", { country: name })}
          </h2>
          <p className="mt-1 text-muted">{t("world.sitesNote")}</p>
          <div className="mt-3">
            <OverviewSiteList sites={overviewSites} dataPath={mapDataPath(region)} />
          </div>
          <p className="mt-3 text-[0.875rem] text-muted">
            {getProvider("pge")?.attribution} ·{" "}
            {t("world.checked", {
              date: formatDate(
                overviewSites.reduce((d, s) => (s.fetchedAt > d ? s.fetchedAt : d), ""),
                "UTC",
              ),
            })}
          </p>
        </section>
      )}
    </div>
  );
}
