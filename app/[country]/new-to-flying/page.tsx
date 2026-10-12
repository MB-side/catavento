import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, GraduationCap, Wind } from "lucide-react";
import { countryPageMetadata } from "@/components/layout/CountryPage";
import { card, h2, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { countryFromParams } from "@/lib/country";
import { schools } from "@/lib/directory";
import { t } from "@/lib/messages";

export function generateMetadata({ params }: PageProps<"/[country]/new-to-flying">) {
  return countryPageMetadata(params, "newToFlying");
}

/** New to flying hub (docs/02 §5.9, docs/07 §6): two paths, tandem or learn. */
export default async function NewToFlyingPage({ params }: PageProps<"/[country]/new-to-flying">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const base = `/${country.code.toLowerCase()}/new-to-flying`;
  const body = country.nationalBody;
  const big = "flex min-h-32 flex-col justify-center gap-1 rounded-[16px] p-5 no-underline lg:p-6";
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("pages.newToFlying.title")} intro={t("ntf.hubIntro")}>
        <p className="mt-1 text-[0.9375rem] text-muted">{t("ntf.gloss")}</p>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`${base}/tandem`} className={`${big} bg-action text-white hover:text-white`}>
          <Wind className="size-8" aria-hidden="true" />
          <span className="font-condensed text-[1.75rem] font-bold">{t("ntf.tandemButton")}</span>
          <span>{t("ntf.tandemButtonText")}</span>
        </Link>
        <Link href={`${base}/learn`} className={`${big} bg-ink text-white hover:text-white`}>
          <GraduationCap className="size-8" aria-hidden="true" />
          <span className="font-condensed text-[1.75rem] font-bold">{t("ntf.learnButton")}</span>
          <span>{t("ntf.learnButtonText")}</span>
        </Link>
      </div>

      <section aria-labelledby="how" className={card}>
        <h2 id="how" className={h2}>
          {t("ntf.howLearningWorks")}
        </h2>
        <p className="mt-2">{t("ntf.howLearningText")}</p>
        <Link href={`${base}/schools`} className={`${linkButton} mt-3`}>
          {t("ntf.schoolsLink")} ({schools(country).length})
        </Link>
      </section>

      <section aria-labelledby="membership" className={card}>
        <h2 id="membership" className={h2}>
          {t("ntf.membershipHeading")}
        </h2>
        <p className="mt-2">{body.membershipLine}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {body.joinUrl && (
            <a href={body.joinUrl} className={linkButton}>
              {t("ntf.joinLink")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
          {body.feesUrl && body.feesUrl !== body.joinUrl && (
            <a href={body.feesUrl} className={linkButton}>
              {t("ntf.feesLink")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </section>

      {country.coverage === "sample" && (
        <p className="text-[0.9375rem] text-muted">{t("ntf.sampleNote")}</p>
      )}
    </div>
  );
}
