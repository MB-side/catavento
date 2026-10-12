import Link from "next/link";
import { notFound } from "next/navigation";
import { SitesExplorer } from "@/components/domain/SitesExplorer";
import { countryPageMetadata } from "@/components/layout/CountryPage";
import { getCountry } from "@/lib/country";
import { t } from "@/lib/messages";
import { siteSummaries } from "@/lib/site-view";
import { regionPath } from "@/lib/sites";

export function generateMetadata({ params }: PageProps<"/[country]/sites">) {
  return countryPageMetadata(params, "sites");
}

/** Sites & map (docs/02 §5.5): every site in the country, with filters and an optional map. */
export default async function SitesPage({ params }: PageProps<"/[country]/sites">) {
  const { country: segment } = await params;
  const country = getCountry(segment);
  if (!country) notFound();
  const sites = siteSummaries(country);
  const regions = country.regions
    .filter((code) => sites.some((s) => s.regionCode === code))
    .map((code) => ({ code, name: country.regionNames[code] ?? code }));
  const hasCommunity = sites.some((s) => s.community);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-condensed text-[2rem] leading-tight font-bold">
          {t("pages.sites.title")} · {country.name}
        </h1>
        <p className="mt-2 text-[1.0625rem]">{t("sitesList.intro", { country: country.name })}</p>
      </header>

      <nav aria-labelledby="regions">
        <h2 id="regions" className="font-condensed text-[1.25rem] font-bold">
          {t("sitesList.browseRegions", { regionLabel: country.regionLabel.toLowerCase() })}
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {regions.map((r) => (
            <li key={r.code}>
              <Link
                href={regionPath(r.code)}
                className="inline-flex min-h-11 items-center rounded-full border border-border-strong bg-surface px-4 font-semibold no-underline"
              >
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {hasCommunity && (
        <p className="text-[0.9375rem] text-muted-strong">{t("sitesList.communityExplainer")}</p>
      )}

      <SitesExplorer sites={sites} regions={regions} regionLabel={country.regionLabel} />
    </div>
  );
}
