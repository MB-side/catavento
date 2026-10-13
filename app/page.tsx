import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Compass, Map as MapIcon, Search, Wrench } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { YourSitesStrip } from "@/components/domain/YourSitesStrip";
import { defaultCountrySegment } from "@/lib/country-codes";
import { getCountry, getEnabledCountries } from "@/lib/country";
import { eventSummary, nationalNotices, upcomingEvents } from "@/lib/events-view";
import { formatDate } from "@/lib/format";
import { getCounts, type CountryCounts } from "@/lib/data";
import { t, tCount, type MessageKey } from "@/lib/messages";
import { absoluteUrl, withBasePath } from "@/lib/paths";
import { homeTitle } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  alternates: { canonical: absoluteUrl("/") },
};

type CountKey = "counts.sites" | "counts.schools" | "counts.gear";

const sections: {
  label: MessageKey;
  text: MessageKey;
  path: string;
  Icon: typeof MapIcon;
  count?: [CountKey, keyof CountryCounts];
}[] = [
  {
    label: "nav.sites",
    text: "home.sites",
    path: "/sites",
    Icon: MapIcon,
    count: ["counts.sites", "sites"],
  },
  { label: "nav.whatsOn", text: "home.whatsOn", path: "/whats-on", Icon: CalendarDays },
  {
    label: "nav.gear",
    text: "home.gear",
    path: "/gear",
    Icon: Wrench,
    count: ["counts.gear", "gear"],
  },
  {
    label: "nav.newToFlying",
    text: "home.newToFlying",
    path: "/new-to-flying",
    Icon: Compass,
    count: ["counts.schools", "schools"],
  },
];

/** "27 clubs · 36 schools": only the counts that are above zero. */
function countLine(counts: CountryCounts): string {
  const parts: [CountKey | "counts.clubs", number][] = [
    ["counts.sites", counts.sites],
    ["counts.clubs", counts.clubs],
    ["counts.schools", counts.schools],
    ["counts.gear", counts.gear],
  ];
  return parts
    .filter(([, n]) => n > 0)
    .map(([key, n]) => tCount(key, n))
    .join(" · ");
}

/**
 * Home: an overview for everyone (D37). Counts come from the data (M1) and appear once above zero.
 * Later milestones add regions under each country (M3), a "Your sites" strip at the top for
 * visitors with saved sites on this device (M5, client-side only), and "Coming up" events (M6).
 */
export default function HomePage() {
  const country = defaultCountrySegment;
  const countries = getEnabledCountries();
  const homeCounts = getCounts(country);

  return (
    <div className="flex flex-col gap-10">
      <YourSitesStrip />
      <section aria-labelledby="welcome" className="max-w-3xl">
        <div className="flex items-center gap-4">
          <LogoMark size={112} className="size-18 shrink-0 lg:size-28" />
          <h1
            id="welcome"
            className="font-condensed text-[2rem] leading-tight font-bold lg:text-[3rem]"
          >
            {siteConfig.name}
          </h1>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[1.125rem] font-medium text-muted-strong">
          <span className="rounded-full bg-info-tint px-2.5 py-0.5 text-[0.8125rem] font-semibold text-link">
            {t("home.directoryLabel")}
          </span>
          {siteConfig.descriptor}
        </p>
        <p className="mt-3 text-[1.0625rem]">{t("home.intro")}</p>

        {/* Plain GET form: works without JavaScript and sends nothing anywhere but /search. */}
        <form action={withBasePath("/search")} method="get" role="search" className="mt-5">
          <label htmlFor="home-search" className="mb-1.5 block font-semibold">
            {t("home.searchLabel")}
          </label>
          <div className="flex gap-2">
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder={t("home.searchPlaceholder")}
              className="min-h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-base placeholder:text-muted"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] bg-ink px-4 font-semibold text-white hover:bg-ink/90"
            >
              <Search className="size-5" aria-hidden="true" />
              {t("home.searchButton")}
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="sections">
        <h2 id="sections" className="font-condensed text-[1.375rem] font-bold">
          {t("home.sectionsHeading")}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map(({ label, text, path, Icon, count }) => (
            <li key={path}>
              <Link
                href={`/${country}${path}/`}
                className="flex h-full min-h-11 flex-col gap-1 rounded-[14px] border border-border bg-surface p-4 text-ink hover:border-link hover:text-ink lg:p-5"
              >
                <span className="flex items-center gap-2 font-condensed text-[1.25rem] font-bold">
                  <Icon className="size-5 text-action" aria-hidden="true" />
                  {t(label)}
                </span>
                <span className="text-muted">{t(text)}</span>
                {count && homeCounts[count[1]] > 0 && (
                  <span className="mt-auto pt-1 text-[0.875rem] font-semibold text-muted-strong">
                    {tCount(count[0], homeCounts[count[1]])}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ComingUp />

      <section aria-labelledby="countries">
        <h2 id="countries" className="font-condensed text-[1.375rem] font-bold">
          {t("home.countriesHeading")}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {countries.map((c) => (
            <li key={c.code}>
              <Link
                href={`/${c.code.toLowerCase()}/`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-border bg-surface p-4 text-ink hover:border-link hover:text-ink lg:p-5"
              >
                <span>
                  <span className="flex items-center gap-2 font-condensed text-[1.25rem] font-bold">
                    {c.name}
                    {c.coverage === "sample" && (
                      <span className="rounded-full bg-prototype-tint px-2 py-0.5 font-sans text-[0.75rem] font-semibold text-prototype-text">
                        {t("home.sampleLabel")}
                      </span>
                    )}
                  </span>
                  <span className="block text-muted">
                    {t("home.nationalBody", { name: c.nationalBody.name })}
                  </span>
                  <span className="mt-1 block text-[0.875rem] font-semibold text-muted-strong">
                    {countLine(getCounts(c.code))}
                  </span>
                </span>
                <ArrowRight className="size-6 shrink-0 text-action" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="max-w-3xl rounded-[14px] bg-info-tint p-4 text-muted-strong">
        {t("home.building")}
      </p>

      <section aria-labelledby="why-the-name" className="max-w-3xl border-t border-border pt-6">
        <h2 id="why-the-name" className="font-condensed text-[1.25rem] font-bold">
          {t("home.whyTheNameLabel")}
        </h2>
        <p className="mt-1 text-muted-strong">{siteConfig.whyTheName}</p>
      </section>
    </div>
  );
}

/** Coming up (D37): the next events and latest notices in the default country, when there are any. */
function ComingUp() {
  const country = getCountry(defaultCountrySegment);
  if (!country) return null;
  const zone = country.timezones[0] ?? "UTC";
  const events = upcomingEvents(country, new Date().toISOString().slice(0, 10))
    .slice(0, 3)
    .map((e) => eventSummary(e, country));
  const notices = nationalNotices(country).slice(0, 3);
  if (events.length === 0 && notices.length === 0) return null;
  return (
    <section aria-labelledby="coming-up" className="grid gap-4 md:grid-cols-2">
      <h2 id="coming-up" className="sr-only">
        {t("home.comingUp")}
      </h2>
      {events.length > 0 && (
        <div className="rounded-[14px] border border-border bg-surface p-4 lg:p-5">
          <h3 className="font-condensed text-[1.375rem] font-bold">{t("home.comingUp")}</h3>
          <ul className="mt-2 flex flex-col gap-1">
            {events.map((e) => (
              <li key={e.id}>
                <a href={e.url}>{e.title}</a>{" "}
                <span className="text-[0.875rem] text-muted">· {e.when}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/${defaultCountrySegment}/whats-on`}
            className="mt-2 inline-flex min-h-11 items-center font-semibold"
          >
            {t("pages.whatsOn.title")}
          </Link>
        </div>
      )}
      {notices.length > 0 && (
        <div className="rounded-[14px] border border-border bg-surface p-4 lg:p-5">
          <h3 className="font-condensed text-[1.375rem] font-bold">{t("home.latestNotices")}</h3>
          <ul className="mt-2 flex flex-col gap-1">
            {notices.map((n) => (
              <li key={n.id}>
                <a href={n.url}>{n.title}</a>{" "}
                <span className="text-[0.875rem] text-muted">· {formatDate(n.date, zone)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
