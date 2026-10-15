import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VisitorRules } from "@/components/domain/VisitorRules";
import { card, h2, PageHeader } from "@/components/layout/PageHeader";
import {
  getGuide,
  getOverviewRegions,
  getTourOperators,
  getVisitingCountries,
  getVisitorHelp,
} from "@/lib/data";
import { t, tCount } from "@/lib/messages";
import { isGroup } from "@/lib/overview";
import { pageMetadata } from "@/lib/seo";
import type { VisitingCountry } from "@/lib/types";
import { TOURS_PATH, visitingHref } from "@/lib/visiting";

export const metadata = pageMetadata({
  title: t("pages.visiting.title"),
  description: t("pages.visiting.summary"),
  path: "/visiting",
});

const tile =
  "flex h-full min-h-11 items-center justify-between gap-3 rounded-[14px] border border-border bg-surface p-4 text-ink hover:border-link hover:text-ink";

function CountryTile({ c, note }: { c: VisitingCountry; note?: string }) {
  const help = getVisitorHelp(c.code).length;
  const tours = getTourOperators(c.code).length;
  const parts = [
    note,
    help > 0 ? tCount("counts.help", help) : undefined,
    tours > 0 ? tCount("counts.tours", tours) : undefined,
  ].filter(Boolean);
  return (
    <li>
      <Link href={visitingHref(c)} className={tile}>
        <span>
          <span className="block font-condensed text-[1.25rem] font-bold">{c.name}</span>
          {parts.length > 0 && (
            <span className="block text-[0.875rem] text-muted">{parts.join(" · ")}</span>
          )}
        </span>
        <ArrowRight className="size-5 shrink-0 text-link" aria-hidden="true" />
      </Link>
    </li>
  );
}

const grid = "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

/** Visiting pilots (D89): every country with a visiting page, flying tours, and rules for any trip. */
export default function VisitingPage() {
  const countries = getVisitingCountries();
  const home = countries.filter((c) => c.group === "home");
  const regions = getOverviewRegions();
  const groups = regions.filter(isGroup);
  const destinations = countries.filter((c) => {
    const r = regions.find((x) => x.slug === c.group);
    return (r && !isGroup(r)) || c.group === "elsewhere";
  });
  const tours = getTourOperators().length;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("pages.visiting.title")} intro={t("visiting.hubIntro")} />

      <section aria-labelledby="home" data-testid="visiting-home">
        <h2 id="home" className={h2}>
          {t("visiting.homeHeading")}
        </h2>
        <ul className={grid}>
          {home.map((c) => (
            <CountryTile key={c.code} c={c} note={t("visiting.homeNote")} />
          ))}
        </ul>
      </section>

      {tours > 0 && (
        <Link href={`${TOURS_PATH}/`} className={`${tile} sm:max-w-md`} data-testid="tours-link">
          <span>
            <span className="block font-condensed text-[1.25rem] font-bold">
              {t("visiting.toursCard")}
            </span>
            <span className="block text-[0.875rem] text-muted">
              {tCount("counts.tours", tours)}
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-link" aria-hidden="true" />
        </Link>
      )}

      {groups.map((r) => {
        const inGroup = countries.filter((c) => c.group === r.slug);
        return inGroup.length > 0 ? (
          <section key={r.slug} aria-labelledby={`group-${r.slug}`}>
            <h2 id={`group-${r.slug}`} className={h2}>
              {r.name}
            </h2>
            <ul className={grid}>
              {inGroup.map((c) => (
                <CountryTile key={c.code} c={c} />
              ))}
            </ul>
          </section>
        ) : null;
      })}

      {destinations.length > 0 && (
        <section aria-labelledby="destinations">
          <h2 id="destinations" className={h2}>
            {t("visiting.otherHeading")}
          </h2>
          <ul className={grid}>
            {destinations.map((c) => (
              <CountryTile key={c.code} c={c} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="any-trip" className={card}>
        <h2 id="any-trip" className={h2}>
          {t("visiting.beforeAnyTrip")}
        </h2>
        <div className="mt-3">
          <VisitorRules guide={getGuide("world")} showBody={false} />
        </div>
      </section>
    </div>
  );
}
