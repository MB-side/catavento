import { notFound } from "next/navigation";
import { OrgCard } from "@/components/domain/OrgCard";
import { card, h2, PageHeader } from "@/components/layout/PageHeader";
import { countryFromParams } from "@/lib/country";
import { byRegion, priceFrom, schools, tandemProviders } from "@/lib/directory";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[country]/new-to-flying/tandem">) {
  const country = await countryFromParams(params);
  return pageMetadata({
    title: `${t("ntf.tandemTitle")} · ${country?.name ?? ""}`,
    description: t("ntf.tandemIntro"),
    path: `/${country?.code.toLowerCase()}/new-to-flying/tandem`,
  });
}

/**
 * Tandem finder (docs/02 §5.9, S5): by region, businesses that publish tandem flights, then the
 * region's other schools (many fly tandems too). Prices only as published.
 */
export default async function TandemPage({ params }: PageProps<"/[country]/new-to-flying/tandem">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const zone = country.timezones[0] ?? "UTC";
  const providers = tandemProviders(country);
  const others = schools(country).filter((s) => !providers.includes(s));
  const regions = byRegion(country, [...providers, ...others]);
  const regionName = (code: string) =>
    code ? (country.regionNames[code] ?? code) : t("ntf.noRegion");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("ntf.tandemTitle")}
        intro={t("ntf.tandemIntro")}
        crumb={{
          href: `/${country.code.toLowerCase()}/new-to-flying`,
          label: t("pages.newToFlying.title"),
        }}
      />

      <section aria-labelledby="expect" className="rounded-[14px] bg-info-tint p-4 lg:p-5">
        <h2 id="expect" className={h2}>
          {t("ntf.expectHeading")}
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-strong">
          <li>{t("ntf.expect1")}</li>
          <li>{t("ntf.expect2")}</li>
          <li>{t("ntf.expect3")}</li>
        </ul>
      </section>

      {regions.map((g) => {
        const known = g.orgs.filter((o) => providers.includes(o));
        const rest = g.orgs.filter((o) => !providers.includes(o));
        const name = regionName(g.code);
        return (
          <section
            key={g.code || "none"}
            aria-labelledby={`r-${g.code || "none"}`}
            className={card}
            data-testid="tandem-region"
          >
            <h2 id={`r-${g.code || "none"}`} className={h2}>
              {name}
            </h2>
            {known.length > 0 ? (
              <>
                <h3 className="mt-3 font-semibold">{t("ntf.tandemKnown")}</h3>
                <ul className="mt-2 grid gap-3 md:grid-cols-2">
                  {known.map((o) => (
                    <OrgCard
                      key={o.id}
                      org={o}
                      regionName={name}
                      price={priceFrom(o.id)}
                      timeZone={zone}
                    />
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-muted">{t("ntf.tandemNone", { region: name })}</p>
            )}
            {rest.length > 0 && (
              <>
                <h3 className="mt-4 font-semibold">{t("ntf.tandemSchools", { region: name })}</h3>
                <p className="text-[0.875rem] text-muted">{t("ntf.tandemSchoolsNote")}</p>
                <ul className="mt-2 grid gap-3 md:grid-cols-2">
                  {rest.map((o) => (
                    <OrgCard
                      key={o.id}
                      org={o}
                      regionName={name}
                      price={priceFrom(o.id)}
                      timeZone={zone}
                    />
                  ))}
                </ul>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
