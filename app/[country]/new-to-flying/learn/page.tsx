import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { card, h2, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { countryFromParams } from "@/lib/country";
import { t } from "@/lib/messages";
import { DISCIPLINE_PAGES } from "@/lib/learn";
import { pageMetadata } from "@/lib/seo";
import { Anchor } from "@/components/ui/anchor";

export async function generateMetadata({ params }: PageProps<"/[country]/new-to-flying/learn">) {
  const country = await countryFromParams(params);
  return pageMetadata({
    title: `${t("ntf.learnTitle")} · ${country?.name ?? ""}`,
    description: t("ntf.learnIntro"),
    path: `/${country?.code.toLowerCase()}/new-to-flying/learn`,
  });
}

/** Learn to fly (docs/07 §6): the pathway, pointing to the national body's own guide. */
export default async function LearnPage({ params }: PageProps<"/[country]/new-to-flying/learn">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const base = `/${country.code.toLowerCase()}/new-to-flying`;
  const body = country.nationalBody.shortName ?? country.nationalBody.name;
  const full = country.coverage === "full";
  const steps = [
    t("ntf.stepTandem"),
    t("ntf.stepCourse", { body }),
    t("ntf.stepMember", { body }),
    t("ntf.stepClub"),
  ];
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("ntf.learnTitle")}
        intro={t("ntf.learnIntro")}
        crumb={{ href: base, label: t("pages.newToFlying.title") }}
      />

      <section aria-labelledby="steps" className={card}>
        <ol className="list-decimal space-y-2 pl-5 text-[1.0625rem]" id="steps">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {country.nationalBody.learnUrl && (
            <Anchor href={country.nationalBody.learnUrl} className={linkButton}>
              {t("ntf.officialSteps", { body })}
              <ExternalLink className="size-4" aria-hidden="true" />
            </Anchor>
          )}
          {country.nationalBody.joinUrl && (
            <Anchor href={country.nationalBody.joinUrl} className={linkButton}>
              {t("ntf.joinLink")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </Anchor>
          )}
          <Link href={`${base}/schools`} className={linkButton}>
            {t("ntf.schoolsLink")}
          </Link>
        </div>
      </section>

      {full && (
        <>
          <section aria-labelledby="disciplines">
            <h2 id="disciplines" className={h2}>
              {t("ntf.disciplinesHeading")}
            </h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-3">
              {DISCIPLINE_PAGES.map((d) => (
                <li key={d.slug} className={card}>
                  <Link
                    href={`${base}/learn/${d.slug}`}
                    className="font-condensed text-[1.375rem] font-bold"
                  >
                    {t(d.title)}
                  </Link>
                  <p className="mt-1 text-muted-strong">{t(d.summary)}</p>
                </li>
              ))}
            </ul>
          </section>
          <div className="flex flex-wrap gap-2">
            <Link href={`${base}/choosing-a-school`} className={linkButton}>
              {t("ntf.choosingLink")}
            </Link>
            <Link href={`${base}/costs`} className={linkButton}>
              {t("ntf.costsLink")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
