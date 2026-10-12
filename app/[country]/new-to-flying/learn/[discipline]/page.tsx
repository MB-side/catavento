import { notFound } from "next/navigation";
import { OrgCard } from "@/components/domain/OrgCard";
import { card, h2, PageHeader } from "@/components/layout/PageHeader";
import { fullCoverageCountries, getCountry } from "@/lib/country";
import { priceFrom, schools } from "@/lib/directory";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { DISCIPLINE_PAGES } from "@/lib/learn";

export const dynamicParams = false;

export function generateStaticParams() {
  return fullCoverageCountries().flatMap((c) =>
    DISCIPLINE_PAGES.map((d) => ({ country: c.code.toLowerCase(), discipline: d.slug })),
  );
}

async function load(params: PageProps<"/[country]/new-to-flying/learn/[discipline]">["params"]) {
  const { country: c, discipline } = await params;
  const country = getCountry(c);
  const page = DISCIPLINE_PAGES.find((d) => d.slug === discipline);
  if (!country || !page || country.coverage !== "full") notFound();
  return { country, page };
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/new-to-flying/learn/[discipline]">) {
  const { country, page } = await load(params);
  return pageMetadata({
    title: `${t(page.title)} · ${country.name}`,
    description: t(page.summary),
    path: `/${country.code.toLowerCase()}/new-to-flying/learn/${page.slug}`,
  });
}

export default async function DisciplinePage({
  params,
}: PageProps<"/[country]/new-to-flying/learn/[discipline]">) {
  const { country, page } = await load(params);
  const zone = country.timezones[0] ?? "UTC";
  const list = schools(country).filter((s) => s.disciplines.includes(page.code));
  const name = t(page.title);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={name}
        intro={t(page.text)}
        crumb={{
          href: `/${country.code.toLowerCase()}/new-to-flying/learn`,
          label: t("ntf.learnTitle"),
        }}
      />
      <section aria-labelledby="format" className={card}>
        <h2 id="format" className={h2}>
          {t("ntf.courseFormat")}
        </h2>
        <p className="mt-2">{t("ntf.courseFormatText")}</p>
      </section>
      <section aria-labelledby="where">
        <h2 id="where" className={h2}>
          {t("ntf.schoolsFor", { discipline: name.toLowerCase(), country: country.name })}
        </h2>
        {list.length === 0 ? (
          <p className="mt-2 text-muted">
            {t("ntf.noSchoolsFor", { discipline: name.toLowerCase() })}
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((o) => (
              <OrgCard
                key={o.id}
                org={o}
                regionName={o.regionCode ? country.regionNames[o.regionCode] : undefined}
                price={priceFrom(o.id)}
                timeZone={zone}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
