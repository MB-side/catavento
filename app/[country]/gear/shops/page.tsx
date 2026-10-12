import { notFound } from "next/navigation";
import { OrgCard } from "@/components/domain/OrgCard";
import { card, PageHeader } from "@/components/layout/PageHeader";
import { countryFromParams } from "@/lib/country";
import { gearOrgs, priceFrom } from "@/lib/directory";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[country]/gear/shops">) {
  const country = await countryFromParams(params);
  return pageMetadata({
    title: `${t("gear.shopsTitle")} · ${country?.name ?? ""}`,
    description: t("gear.shopsText"),
    path: `/${country?.code.toLowerCase()}/gear/shops`,
  });
}

export default async function ShopsPage({ params }: PageProps<"/[country]/gear/shops">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const zone = country.timezones[0] ?? "UTC";
  const orgs = gearOrgs(country);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("gear.shopsTitle")}
        intro={t("gear.shopsText")}
        crumb={{ href: `/${country.code.toLowerCase()}/gear`, label: t("pages.gear.title") }}
      />
      {orgs.length === 0 ? (
        <p className={card}>{t("gear.noneYet", { country: country.name })}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orgs.map((o) => (
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
    </div>
  );
}
