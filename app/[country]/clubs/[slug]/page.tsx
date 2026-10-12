import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail } from "lucide-react";
import { FollowClubButton } from "@/components/domain/FollowClubButton";
import { SiteCard } from "@/components/domain/SiteCard";
import { clubBySlug, clubPath, clubsIn, clubView } from "@/lib/club-view";
import { getCountry, getEnabledCountries } from "@/lib/country";
import { getProvider } from "@/lib/data";
import { dateBlock, formatDate } from "@/lib/format";
import { correctionFormUrl } from "@/lib/links";
import { t, tOr } from "@/lib/messages";
import { absoluteUrl } from "@/lib/paths";
import { jsonLdScript, pageMetadata } from "@/lib/seo";
import { siteSummaries } from "@/lib/site-view";
import type { Organisation } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return getEnabledCountries().flatMap((c) =>
    clubsIn(c).map((o) => ({ country: c.code.toLowerCase(), slug: o.slug })),
  );
}

async function load(params: PageProps<"/[country]/clubs/[slug]">["params"]) {
  const { country: c, slug } = await params;
  const country = getCountry(c);
  const club = country ? clubBySlug(country, slug) : undefined;
  if (!country || !club) notFound();
  return { country, club };
}

function regionOf(
  country: { regionNames: Record<string, string> },
  club: Organisation,
): string | undefined {
  return club.regionCode ? (country.regionNames[club.regionCode] ?? club.regionCode) : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/clubs/[slug]">): Promise<Metadata> {
  const { country, club } = await load(params);
  const region = regionOf(country, club);
  return pageMetadata({
    title: club.name,
    description: [tOr(`club.kind.${club.kind}`, "club.kind.club"), region, country.name]
      .filter(Boolean)
      .join(" · "),
    path: clubPath(club),
  });
}

const card = "rounded-[14px] border border-border bg-surface p-4 lg:p-5";
const h2 = "font-condensed text-[1.375rem] font-bold";
const button =
  "inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 font-semibold no-underline";

export default async function ClubPage({ params }: PageProps<"/[country]/clubs/[slug]">) {
  const { country, club } = await load(params);
  const zone = country.timezones[0] ?? "UTC";
  const view = clubView(club, new Date().toISOString().slice(0, 10));
  const region = regionOf(country, club);
  const summaries = new Map(siteSummaries(country).map((s) => [s.id, s]));
  const cards = (ids: string[]) =>
    ids.map((id) => summaries.get(id)).filter((s) => s !== undefined);
  const managed = cards(view.managed.map((s) => s.id));
  const listed = cards(view.listed.map((s) => s.id));
  // Contacts come from the organisation's own listing at a source (e.g. the national body's directory).
  const listedAt = club.sources.find((s) => s.providerId !== "manual");
  const sourceName =
    (listedAt && getProvider(listedAt.providerId)?.name) ?? country.nationalBody.name;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: club.name,
    url: absoluteUrl(clubPath(club)),
    ...(club.website ? { sameAs: [club.website] } : {}),
    ...(region ? { areaServed: region } : {}),
  };
  const kind = tOr(`club.kind.${club.kind}`, "club.kind.club");

  return (
    <article className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <header className={card}>
        <nav aria-label={t("club.crumb")} className="text-[0.875rem] text-muted">
          <Link href={`/${country.code.toLowerCase()}/clubs`}>{t("club.crumb")}</Link>
          {region ? ` › ${region}` : ""}
        </nav>
        <h1 className="mt-1 font-condensed text-[2rem] leading-tight font-bold lg:text-[2.5rem]">
          {club.name}
        </h1>
        <p className="mt-1 text-[1.0625rem] text-muted-strong">
          {[region, kind].filter(Boolean).join(" · ")}
        </p>
        {view.association && (
          <p className="mt-1 text-[0.9375rem]">
            {t("club.partOf", { name: "" }).trim()}{" "}
            <Link href={clubPath(view.association)}>{view.association.name}</Link>
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <FollowClubButton siteIds={view.managed.map((s) => s.id)} />
          {club.emailPublic && (
            <a
              href={`mailto:${club.emailPublic}`}
              className={`${button} bg-ink text-white hover:text-white`}
            >
              <Mail className="size-4" aria-hidden="true" />
              {t("club.contact")}
            </a>
          )}
          {club.website && (
            <a
              href={club.website}
              className={`${button} border border-border-strong bg-surface text-ink hover:text-ink`}
            >
              {t("club.website")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="managed" className={card}>
            <h2 id="managed" className={h2}>
              {t("club.managedHeading")}
            </h2>
            {managed.length === 0 ? (
              <p className="mt-2 text-muted">{t("club.noSites")}</p>
            ) : (
              <>
                <p className="mt-1 text-[0.875rem] text-muted">{t("club.managedNote")}</p>
                <ul className="mt-3 grid gap-3 md:grid-cols-2" data-testid="club-managed">
                  {managed.map((s) => (
                    <SiteCard key={s.id} site={s} showOrg={false} />
                  ))}
                </ul>
              </>
            )}
          </section>

          {listed.length > 0 && (
            <section aria-labelledby="listed" className={card}>
              <h2 id="listed" className={h2}>
                {t("club.listedHeading")}
              </h2>
              <p className="mt-1 text-[0.875rem] text-muted">{t("club.listedNote")}</p>
              <ul className="mt-3 grid gap-3 md:grid-cols-2" data-testid="club-listed">
                {listed.map((s) => (
                  <SiteCard key={s.id} site={s} showOrg={false} />
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="flying" className={card}>
            <h2 id="flying" className={h2}>
              {t("club.flyingHeading")}
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>{country.nationalBody.membershipLine}</li>
              <li>{t("club.flyingContact")}</li>
              <li>{t("club.flyingRatings")}</li>
              <li>{club.website ? t("club.flyingJoin") : t("club.flyingJoinNoSite")}</li>
            </ol>
          </section>

          <section aria-labelledby="news" className={card}>
            <h2 id="news" className={h2}>
              {t("club.newsHeading")}
            </h2>
            {view.notices.length === 0 ? (
              <p className="mt-2 text-muted">{t("club.newsNone")}</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {view.notices.map((n) => (
                  <li key={n.id}>
                    <a href={n.url}>{n.title}</a>{" "}
                    <span className="text-[0.875rem] text-muted">· {formatDate(n.date, zone)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="events" className={card}>
            <h2 id="events" className={h2}>
              {t("club.eventsHeading")}
            </h2>
            {view.events.length === 0 ? (
              <p className="mt-2 text-muted">{t("club.eventsNone")}</p>
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
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="contacts" className={card}>
            <h2 id="contacts" className={h2}>
              {t("club.contactsHeading")}
            </h2>
            {club.emailPublic || club.website ? (
              <ul className="mt-2 flex flex-col gap-1 break-words">
                {club.emailPublic && (
                  <li>
                    <a href={`mailto:${club.emailPublic}`}>{club.emailPublic}</a>
                  </li>
                )}
                {club.website && (
                  <li>
                    <a href={club.website}>
                      {club.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-2 text-muted">{t("club.notPublished")}</p>
            )}
            <p className="mt-2 text-[0.8125rem] text-muted">
              {t("club.contactsNote", { source: sourceName })}
            </p>
          </section>

          {view.stations.length > 0 && (
            <section aria-labelledby="stations" className={card}>
              <h2 id="stations" className={h2}>
                {t("club.stationsHeading")}
              </h2>
              <ul className="mt-2 flex flex-col gap-2">
                {view.stations.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      className="inline-flex min-h-11 items-center gap-1.5 font-semibold"
                    >
                      {s.name}
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {view.members.length > 0 && (
            <section aria-labelledby="members" className={card}>
              <h2 id="members" className={h2}>
                {t("club.membersHeading")}
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                {view.members.map((o) => (
                  <li key={o.id}>
                    <Link href={clubPath(o)}>{o.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {region && view.nearby.length > 0 && (
            <section aria-labelledby="nearby" className={card}>
              <h2 id="nearby" className={h2}>
                {t("club.nearbyHeading", { region })}
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                {view.nearby.map((o) => (
                  <li key={o.id}>
                    <Link href={clubPath(o)}>{o.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="claim" className="rounded-[14px] bg-info-tint p-4 lg:p-5">
            <h2 id="claim" className="font-condensed text-[1.25rem] font-bold">
              {t("club.claimHeading")}
            </h2>
            <p className="mt-1 text-muted-strong">{t("club.claimText")}</p>
            <a
              href={correctionFormUrl(absoluteUrl(clubPath(club)), club.id)}
              className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
            >
              {t("club.claimLink")}
            </a>
          </section>
        </aside>
      </div>

      <footer aria-labelledby="sources" className="text-[0.875rem] text-muted">
        <h2 id="sources" className="font-semibold text-muted-strong">
          {t("club.sourcesHeading")}
        </h2>
        <ul className="mt-1 flex flex-col gap-0.5">
          {club.sources.map((s) => {
            const p = getProvider(s.providerId);
            return (
              <li key={`${s.providerId}${s.url}`}>
                <a href={s.url}>
                  {p?.attribution.replace(/\{[^}]+\}/g, club.name) ?? s.providerId}
                </a>{" "}
                · {formatDate(s.fetchedAt, zone)}
              </li>
            );
          })}
        </ul>
      </footer>
    </article>
  );
}
