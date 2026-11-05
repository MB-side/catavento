import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { YourSitesStrip } from "@/components/domain/YourSitesStrip";
import { getEnabledCountries } from "@/lib/country";
import { getCounts, getOverviewRegions, type CountryCounts } from "@/lib/data";
import { isGroup, worldPath } from "@/lib/overview";
import { visitingHref, visitingPath } from "@/lib/visiting";
import { CoverageBadge } from "@/components/domain/CoverageBadge";
import { t, tCount } from "@/lib/messages";
import { absoluteUrl, withBasePath } from "@/lib/paths";
import { homeTitle } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  alternates: { canonical: absoluteUrl("/") },
};

type CountKey = "counts.sites" | "counts.schools" | "counts.gear";

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
  const countries = getEnabledCountries();

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
                    <span className="font-sans">
                      <CoverageBadge coverage={c.coverage === "full" ? "full" : "partial"} />
                    </span>
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

      <section aria-labelledby="elsewhere">
        <h2 id="elsewhere" className="font-condensed text-[1.375rem] font-bold">
          {t("home.elsewhereHeading")}
        </h2>
        <p className="mt-1 max-w-3xl text-muted-strong">{t("home.elsewhereText")}</p>
        <p className="mt-2">
          <Link href={`${visitingPath()}/`} className="font-semibold">
            {t("home.allDestinations")}
          </Link>
        </p>
        <ul className="mt-3 flex flex-wrap gap-2" data-testid="home-elsewhere">
          {getOverviewRegions().map((r) => (
            <li key={r.slug}>
              <Link
                href={
                  isGroup(r) ? `${worldPath(r)}/` : visitingHref(r.countries[0] ?? { code: "" })
                }
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 font-semibold text-ink hover:border-link hover:text-ink"
              >
                {r.name}
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
