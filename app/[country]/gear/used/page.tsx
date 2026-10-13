import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { card, h2, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { orgPath } from "@/lib/clubs";
import { countryFromParams } from "@/lib/country";
import { serviceCentres } from "@/lib/directory";
import { t } from "@/lib/messages";
import { siteConfig } from "@/site.config";
import { pageMetadata } from "@/lib/seo";
import { Anchor } from "@/components/ui/anchor";

export async function generateMetadata({ params }: PageProps<"/[country]/gear/used">) {
  const country = await countryFromParams(params);
  return pageMetadata({
    title: `${t("gear.usedTitle")} · ${country?.name ?? ""}`,
    description: t("gear.usedText"),
    path: `/${country?.code.toLowerCase()}/gear/used`,
  });
}

/** Used gear (docs/07 §7): short, link-heavy guidance; no thresholds of our own; no listings. */
export default async function UsedGearPage({ params }: PageProps<"/[country]/gear/used">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const centres = serviceCentres(country);
  const body = country.nationalBody.shortName ?? country.nationalBody.name;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("gear.usedTitle")}
        intro={t("gear.usedIntro")}
        crumb={{ href: `/${country.code.toLowerCase()}/gear`, label: t("pages.gear.title") }}
      />
      <section className={card}>
        <ul className="list-disc space-y-1 pl-5">
          {(["gear.used1", "gear.used2", "gear.used3", "gear.used4", "gear.used5"] as const).map(
            (k) => (
              <li key={k}>{t(k)}</li>
            ),
          )}
        </ul>
        <p className="mt-3 font-semibold">{t("gear.usedService")}</p>
        {country.nationalBody.equipmentUrl && (
          <Anchor href={country.nationalBody.equipmentUrl} className={`${linkButton} mt-3`}>
            {t("gear.usedAdvice", { body })}
            <ExternalLink className="size-4" aria-hidden="true" />
          </Anchor>
        )}
      </section>
      {centres.length > 0 && (
        <section aria-labelledby="centres" className={card}>
          <h2 id="centres" className={h2}>
            {t("gear.serviceCentres")}
          </h2>
          <ul className="mt-2">
            {centres.map((o) => (
              <li key={o.id}>
                <Link href={orgPath(o)}>{o.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="classifieds" className="rounded-[14px] bg-info-tint p-4 lg:p-5">
        <h2 id="classifieds" className={h2}>
          {t("gear.classifiedsHeading")}
        </h2>
        <p className="mt-1 text-muted-strong">{t("gear.classifiedsText")}</p>
        <Anchor
          href={siteConfig.feedbackFormUrl}
          className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          {t("gear.classifiedsLink")}
        </Anchor>
      </section>
    </div>
  );
}
