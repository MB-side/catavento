import Link from "next/link";
import { notFound } from "next/navigation";
import { card, PageHeader } from "@/components/layout/PageHeader";
import { orgPath } from "@/lib/clubs";
import { countryFromParams } from "@/lib/country";
import { getBrands, getOrganisation } from "@/lib/data";
import { t, tOr } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[country]/gear/where-to-buy">) {
  const country = await countryFromParams(params);
  return pageMetadata({
    title: `${t("gear.whereTitle")} · ${country?.name ?? ""}`,
    description: t("gear.whereText", { country: country?.name ?? "" }),
    path: `/${country?.code.toLowerCase()}/gear/where-to-buy`,
  });
}

/** Where to buy (docs/02 §5.8): each brand and the businesses that import, sell or service it. */
export default async function WhereToBuyPage({
  params,
}: PageProps<"/[country]/gear/where-to-buy">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const brands = getBrands()
    .map((b) => ({
      brand: b,
      who: b.distributors
        .map((d) => ({ org: getOrganisation(d.orgId), role: d.role }))
        .filter((x) => x.org?.country === country.code),
    }))
    .filter((x) => x.who.length > 0);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("gear.whereTitle")}
        intro={t("gear.whereText", { country: country.name })}
        crumb={{ href: `/${country.code.toLowerCase()}/gear`, label: t("pages.gear.title") }}
      />
      {brands.length === 0 ? (
        <p className={card}>{t("gear.noneYet", { country: country.name })}</p>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="brands">
            {brands.map(({ brand, who }) => (
              <li key={brand.id} className={card}>
                <h2 className="font-condensed text-[1.375rem] font-bold">{brand.name}</h2>
                <ul className="mt-1 flex flex-col gap-1">
                  {who.map(({ org, role }) =>
                    org ? (
                      <li key={`${org.id}${role}`}>
                        <Link href={orgPath(org)}>{org.name}</Link>{" "}
                        <span className="text-[0.875rem] text-muted">
                          · {tOr(`gear.role.${role}`, "gear.role.dealer")}
                        </span>
                      </li>
                    ) : null,
                  )}
                </ul>
              </li>
            ))}
          </ul>
          <p className="text-[0.9375rem] text-muted">{t("gear.brandsNote")}</p>
          <Link
            href={`/${country.code.toLowerCase()}/gear/shops`}
            className="self-start font-semibold"
          >
            {t("gear.findByType")}
          </Link>
        </>
      )}
    </div>
  );
}
