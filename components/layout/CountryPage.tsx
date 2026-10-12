import "server-only";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountry } from "@/lib/country";
import { WindyMap } from "@/components/domain/WindyMap";
import { getCounts } from "@/lib/data";
import { windyEmbedUrl } from "@/lib/links";
import { t, tCount, type MessageKey } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import type { Country } from "@/lib/types";

const pages = {
  countryHome: { title: "pages.countryHome.title", summary: "pages.countryHome.summary", path: "" },
  sites: { title: "pages.sites.title", summary: "pages.sites.summary", path: "/sites" },
  clubs: { title: "pages.clubs.title", summary: "pages.clubs.summary", path: "/clubs" },
  whatsOn: { title: "pages.whatsOn.title", summary: "pages.whatsOn.summary", path: "/whats-on" },
  gear: { title: "pages.gear.title", summary: "pages.gear.summary", path: "/gear" },
  newToFlying: {
    title: "pages.newToFlying.title",
    summary: "pages.newToFlying.summary",
    path: "/new-to-flying",
  },
  visitingPilots: {
    title: "pages.visitingPilots.title",
    summary: "pages.visitingPilots.summary",
    path: "/visiting-pilots",
  },
} satisfies Record<string, { title: MessageKey; summary: MessageKey; path: string }>;

export type CountryPageKey = keyof typeof pages;

type CountryParams = Promise<{ country: string }>;

async function resolveCountry(params: CountryParams): Promise<Country> {
  const { country: segment } = await params;
  const country = getCountry(segment);
  if (!country) notFound();
  return country;
}

function texts(key: CountryPageKey, country: Country) {
  const page = pages[key];
  const vars = { country: country.name };
  return { title: t(page.title, vars), summary: t(page.summary, vars), path: page.path };
}

export async function countryPageMetadata(
  params: CountryParams,
  key: CountryPageKey,
): Promise<Metadata> {
  const country = await resolveCountry(params);
  const { title, summary, path } = texts(key, country);
  const pageTitle = key === "countryHome" ? title : `${title} · ${country.name}`;
  return pageMetadata({
    title: pageTitle,
    description: summary,
    path: `/${country.code.toLowerCase()}${path}`,
  });
}

/** What the data already holds for this country, e.g. "27 clubs · 36 schools · 9 weather station links". */
export function CountryCountsLine({ code }: { code: string }) {
  const counts = getCounts(code);
  const items = (
    [
      ["counts.sites", counts.sites],
      ["counts.clubs", counts.clubs],
      ["counts.schools", counts.schools],
      ["counts.gear", counts.gear],
      ["counts.stations", counts.stations],
    ] as const
  )
    .filter(([, n]) => n > 0)
    .map(([key, n]) => tCount(key, n));
  if (items.length === 0) return null;
  return (
    <p className="mt-3 font-semibold text-muted-strong" data-testid="country-counts">
      {items.join(" · ")}
    </p>
  );
}

/** Live wind: Windy's map (on tap) and the placeholder for station widgets awaiting permission (D44, D45). */
export function LiveWind({ country }: { country: Country }) {
  const stations = getCounts(country.code).stations;
  return (
    <section aria-labelledby="live-wind" className="mt-8">
      <h2 id="live-wind" className="font-condensed text-[1.375rem] font-bold">
        {t("liveWind.heading")}
      </h2>
      {country.map && (
        <>
          <p className="mt-1 text-muted">{t("liveWind.intro", { country: country.name })}</p>
          <div className="mt-3">
            <WindyMap
              src={windyEmbedUrl({ ...country.map, speedUnit: country.defaultUnits.speed })}
              placeName={country.name}
            />
          </div>
        </>
      )}
      <div
        className="mt-4 rounded-[14px] border border-dashed border-border-strong p-4"
        data-testid="stations-placeholder"
      >
        <h3 className="font-semibold">{t("liveWind.stationsHeading")}</h3>
        <p className="mt-1 text-muted-strong">{t("liveWind.stationsText")}</p>
        {stations > 0 && (
          <p className="mt-1 text-[0.875rem] text-muted">
            {t("liveWind.stationsCount", { count: String(stations), country: country.name })}
          </p>
        )}
      </div>
    </section>
  );
}
