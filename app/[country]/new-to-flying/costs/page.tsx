import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { card, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { fullCoverageCountries, getCountry } from "@/lib/country";
import { getOfferings, getOrganisation } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { orgPath } from "@/lib/clubs";
import { t } from "@/lib/messages";
import { formatPrice } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return fullCoverageCountries().map((c) => ({ country: c.code.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps<"/[country]/new-to-flying/costs">) {
  const { country } = await params;
  return pageMetadata({
    title: t("ntf.costsTitle"),
    description: t("ntf.costsIntro"),
    path: `/${country}/new-to-flying/costs`,
  });
}

/** What it costs (docs/07 §6): only published prices, each with its source and date. */
export default async function CostsPage({ params }: PageProps<"/[country]/new-to-flying/costs">) {
  const { country: c } = await params;
  const country = getCountry(c);
  if (!country || country.coverage !== "full") notFound();
  const zone = country.timezones[0] ?? "UTC";
  const body = country.nationalBody.shortName ?? country.nationalBody.name;
  const offers = getOfferings()
    .map((o) => ({ o, org: getOrganisation(o.orgId) }))
    .filter((x) => x.org?.country === country.code && x.o.priceFrom !== undefined);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("ntf.costsTitle")}
        intro={t("ntf.costsIntro")}
        crumb={{ href: `/${c}/new-to-flying/learn`, label: t("ntf.learnTitle") }}
      />
      {offers.length > 0 && (
        <ul className="flex flex-col gap-3">
          {offers.map(({ o, org }) => (
            <li key={`${o.orgId}${o.title}`} className={card}>
              <p className="font-condensed text-[1.25rem] font-bold">
                {formatPrice(o.priceFrom as number, o.currency)} · {o.title}
              </p>
              {org && (
                <p>
                  <Link href={orgPath(org)}>{org.name}</Link>
                </p>
              )}
              {o.inclusions && o.inclusions.length > 0 && (
                <p className="text-muted-strong">{o.inclusions.join(", ")}</p>
              )}
              <p className="mt-1 text-[0.875rem] text-muted">
                <a href={o.url}>
                  {t("directory.offeringSource", {
                    name: org?.name ?? "",
                    date: formatDate(o.source.fetchedAt, zone),
                  })}
                </a>
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className={card}>{t("ntf.costsNone")}</p>
      <div className={card}>
        <p>{t("ntf.costsMembership", { body })}</p>
        {country.nationalBody.feesUrl && (
          <a href={country.nationalBody.feesUrl} className={`${linkButton} mt-3`}>
            {t("ntf.feesLink")}
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}
