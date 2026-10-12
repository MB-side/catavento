import Link from "next/link";
import { notFound } from "next/navigation";
import { card, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { fullCoverageCountries, getCountry } from "@/lib/country";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return fullCoverageCountries().map((c) => ({ country: c.code.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/new-to-flying/choosing-a-school">) {
  const { country } = await params;
  return pageMetadata({
    title: t("ntf.choosingTitle"),
    description: t("ntf.choosingIntro"),
    path: `/${country}/new-to-flying/choosing-a-school`,
  });
}

/** How to choose a school (docs/07 §6): a practical checklist, no rankings. */
export default async function ChoosingPage({
  params,
}: PageProps<"/[country]/new-to-flying/choosing-a-school">) {
  const { country: c } = await params;
  const country = getCountry(c);
  if (!country || country.coverage !== "full") notFound();
  const body = country.nationalBody.shortName ?? country.nationalBody.name;
  const items = [
    t("ntf.choose1"),
    t("ntf.choose2"),
    t("ntf.choose3"),
    t("ntf.choose4"),
    t("ntf.choose5"),
    t("ntf.choose6", { body }),
    t("ntf.choose7"),
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("ntf.choosingTitle")}
        intro={t("ntf.choosingIntro")}
        crumb={{ href: `/${c}/new-to-flying/learn`, label: t("ntf.learnTitle") }}
      />
      <ul className={`${card} list-disc space-y-2 pl-9`}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <Link href={`/${c}/new-to-flying/schools`} className={`${linkButton} self-start`}>
        {t("ntf.schoolsLink")}
      </Link>
    </div>
  );
}
