import { notFound } from "next/navigation";
import { kindLabels } from "@/components/domain/OrgCard";
import { SchoolsExplorer, type SchoolSummary } from "@/components/domain/SchoolsExplorer";
import { PageHeader } from "@/components/layout/PageHeader";
import { orgPath } from "@/lib/clubs";
import { countryFromParams } from "@/lib/country";
import { getOfferings } from "@/lib/data";
import { priceFrom, schools } from "@/lib/directory";
import { t, tOr } from "@/lib/messages";
import { formatPrice } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[country]/new-to-flying/schools">) {
  const country = await countryFromParams(params);
  return pageMetadata({
    title: `${t("ntf.schoolsTitle")} · ${country?.name ?? ""}`,
    description: t("ntf.schoolsIntro"),
    path: `/${country?.code.toLowerCase()}/new-to-flying/schools`,
  });
}

export default async function SchoolsPage({
  params,
}: PageProps<"/[country]/new-to-flying/schools">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const list: SchoolSummary[] = schools(country).map((o) => {
    const price = priceFrom(o.id);
    const accommodation = getOfferings(o.id)
      .flatMap((x) => x.inclusions ?? [])
      .find((i) => /accommodation/i.test(i));
    const region = o.regionCode ? country.regionNames[o.regionCode] : undefined;
    return {
      id: o.id,
      name: o.name,
      href: orgPath(o),
      kinds: kindLabels(o),
      disciplines: o.disciplines.map((d) => ({
        code: d,
        label: tOr(`disciplines.${d}`, "disciplines.PG"),
      })),
      regionCode: o.regionCode,
      location: [o.locality, region].filter(Boolean).join(", ") || undefined,
      accommodation,
      price:
        price?.priceFrom !== undefined
          ? {
              text: t("ntf.priceFrom", { price: formatPrice(price.priceFrom, price.currency) }),
              title: price.title,
              url: price.url,
            }
          : undefined,
      website: o.website,
      listed: !!o.nationalBodyListed,
    };
  });
  const regions = country.regions
    .filter((r) => list.some((s) => s.regionCode === r))
    .map((code) => ({ code, name: country.regionNames[code] ?? code }));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("ntf.schoolsTitle")}
        intro={t("ntf.schoolsIntro")}
        crumb={{
          href: `/${country.code.toLowerCase()}/new-to-flying`,
          label: t("pages.newToFlying.title"),
        }}
      />
      <SchoolsExplorer
        schools={list}
        regions={regions}
        regionLabel={country.regionLabel}
        bodyName={country.nationalBody.shortName ?? country.nationalBody.name}
      />
    </div>
  );
}
