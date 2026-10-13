import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { countryPageMetadata } from "@/components/layout/CountryPage";
import { card, h2, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { countryFromParams } from "@/lib/country";
import { t } from "@/lib/messages";
import { Anchor } from "@/components/ui/anchor";

export function generateMetadata({ params }: PageProps<"/[country]/visiting-pilots">) {
  return countryPageMetadata(params, "visitingPilots");
}

/** Flying in a country as a visitor (docs/02 §4): membership, clubs, sites, ratings. */
export default async function VisitingPilotsPage({
  params,
}: PageProps<"/[country]/visiting-pilots">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const seg = `/${country.code.toLowerCase()}`;
  const body = country.nationalBody;
  const short = body.shortName ?? body.name;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("pages.visitingPilots.title")}
        intro={t("visiting.intro", { country: country.name })}
      />
      <section aria-labelledby="membership" className={card}>
        <h2 id="membership" className={h2}>
          {t("visiting.membershipHeading")}
        </h2>
        <p className="mt-2">{body.membershipLine}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {body.visitingPilotsUrl && (
            <Anchor href={body.visitingPilotsUrl} className={linkButton}>
              {t("visiting.officialPage", { body: short })}
              <ExternalLink className="size-4" aria-hidden="true" />
            </Anchor>
          )}
          {body.joinUrl && (
            <Anchor href={body.joinUrl} className={linkButton}>
              {t("ntf.joinLink")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </Anchor>
          )}
        </div>
      </section>
      <section aria-labelledby="clubs" className={card}>
        <h2 id="clubs" className={h2}>
          {t("visiting.clubsHeading")}
        </h2>
        <p className="mt-2">{t("visiting.clubsText")}</p>
        <Link href={`${seg}/clubs`} className={`${linkButton} mt-3`}>
          {t("visiting.clubsLink")}
        </Link>
      </section>
      <section aria-labelledby="sites" className={card}>
        <h2 id="sites" className={h2}>
          {t("visiting.sitesHeading")}
        </h2>
        <p className="mt-2">{t("visiting.sitesText")}</p>
        <Link href={`${seg}/sites`} className={`${linkButton} mt-3`}>
          {t("visiting.sitesLink")}
        </Link>
      </section>
      <section aria-labelledby="ratings" className={card}>
        <h2 id="ratings" className={h2}>
          {t("visiting.ratingsHeading")}
        </h2>
        <p className="mt-2">{country.ratingsNote}</p>
      </section>
      <section aria-labelledby="forecast" className={card}>
        <h2 id="forecast" className={h2}>
          {t("visiting.forecastHeading")}
        </h2>
        <p className="mt-2">{t("visiting.forecastText")}</p>
      </section>
    </div>
  );
}
