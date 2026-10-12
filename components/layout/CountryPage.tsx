import "server-only";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCountry } from "@/lib/country";
import { getCounts } from "@/lib/data";
import { t, tCount, type MessageKey } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import type { Country } from "@/lib/types";
import { ComingSoon } from "./ComingSoon";

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

/** Placeholder for a country section until its milestone builds it. */
export async function CountryPage({
  params,
  page,
}: {
  params: CountryParams;
  page: CountryPageKey;
}) {
  const country = await resolveCountry(params);
  const { title, summary } = texts(page, country);
  const segment = country.code.toLowerCase();
  return (
    <ComingSoon title={title} summary={summary}>
      {page === "countryHome" && <CountryCountsLine code={country.code} />}
      {page === "countryHome" && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {(["sites", "clubs", "whatsOn", "gear", "newToFlying", "visitingPilots"] as const).map(
            (key) => (
              <li key={key}>
                <Link
                  href={`/${segment}${pages[key].path}/`}
                  className="inline-flex min-h-11 items-center rounded-full border border-border-strong bg-surface px-4 font-semibold text-ink hover:text-ink"
                >
                  {t(pages[key].title)}
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
    </ComingSoon>
  );
}

/** What the data already holds for this country, e.g. "27 clubs · 36 schools · 9 weather station links". */
function CountryCountsLine({ code }: { code: string }) {
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
