import Link from "next/link";
import { notFound } from "next/navigation";
import { countryPageMetadata } from "@/components/layout/CountryPage";
import { clubCounts, clubPath, clubsIn } from "@/lib/club-view";
import { getCountry } from "@/lib/country";
import { t, tOr } from "@/lib/messages";
import type { Organisation } from "@/lib/types";

export function generateMetadata({ params }: PageProps<"/[country]/clubs">) {
  return countryPageMetadata(params, "clubs");
}

const plural = (n: number) => (new Intl.PluralRules("en").select(n) === "one" ? "one" : "other");

function ClubRow({ club }: { club: Organisation }) {
  const { managed, listed } = clubCounts(club);
  return (
    <li className="flex flex-col gap-0.5 rounded-[12px] border border-border bg-surface p-3">
      <Link href={clubPath(club)} className="font-semibold">
        {club.name}
      </Link>
      <span className="text-[0.875rem] text-muted">
        {[
          club.kind === "regional_association" ? t("clubs.association") : undefined,
          managed
            ? tOr(`clubs.managesCount.${plural(managed)}`, "clubs.managesCount.other", {
                count: String(managed),
              })
            : undefined,
          listed
            ? tOr(`clubs.listedCount.${plural(listed)}`, "clubs.listedCount.other", {
                count: String(listed),
              })
            : undefined,
          !managed && !listed ? t("clubs.noSites") : undefined,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </li>
  );
}

/** Clubs (docs/02 §5.6): grouped by region, associations first in each. */
export default async function ClubsPage({ params }: PageProps<"/[country]/clubs">) {
  const { country: segment } = await params;
  const country = getCountry(segment);
  if (!country) notFound();
  const clubs = clubsIn(country);
  const groups = [
    ...country.regions.map((code) => ({ key: code, name: country.regionNames[code] ?? code })),
    { key: "", name: t("clubs.noRegion") },
  ]
    .map((g) => ({
      ...g,
      clubs: clubs
        .filter((c) => (c.regionCode ?? "") === g.key)
        .sort(
          (a, b) =>
            Number(b.kind === "regional_association") - Number(a.kind === "regional_association") ||
            a.name.localeCompare(b.name),
        ),
    }))
    .filter((g) => g.clubs.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-condensed text-[2rem] leading-tight font-bold">
          {t("pages.clubs.title")} · {country.name}
        </h1>
        <p className="mt-2 text-[1.0625rem]">{t("clubs.intro")}</p>
        <p className="mt-1 font-semibold" data-testid="club-count">
          {tOr(`clubs.count.${plural(clubs.length)}`, "clubs.count.other", {
            count: String(clubs.length),
          })}
        </p>
      </header>
      {groups.map((g) => (
        <section key={g.key || "none"} aria-labelledby={`region-${g.key || "none"}`}>
          <h2 id={`region-${g.key || "none"}`} className="font-condensed text-[1.375rem] font-bold">
            {g.name}
          </h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {g.clubs.map((c) => (
              <ClubRow key={c.id} club={c} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
