import Link from "next/link";
import { notFound } from "next/navigation";
import { countryPageMetadata } from "@/components/layout/CountryPage";
import { card, PageHeader } from "@/components/layout/PageHeader";
import { countryFromParams } from "@/lib/country";
import { getBrands } from "@/lib/data";
import { gearOrgs } from "@/lib/directory";
import { t } from "@/lib/messages";

export function generateMetadata({ params }: PageProps<"/[country]/gear">) {
  return countryPageMetadata(params, "gear");
}

/** Gear hub (docs/02 §5.8). */
export default async function GearPage({ params }: PageProps<"/[country]/gear">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const base = `/${country.code.toLowerCase()}/gear`;
  const orgIds = new Set(gearOrgs(country).map((o) => o.id));
  const brandCount = getBrands().filter((b) =>
    b.distributors.some((d) => orgIds.has(d.orgId)),
  ).length;
  const tiles = [
    {
      href: `${base}/where-to-buy`,
      title: t("gear.whereTitle"),
      text: t("gear.whereText", { country: country.name }),
      count: brandCount,
    },
    {
      href: `${base}/shops`,
      title: t("gear.shopsTitle"),
      text: t("gear.shopsText"),
      count: orgIds.size,
    },
    {
      href: `${base}/used`,
      title: t("gear.usedTitle"),
      text: t("gear.usedText"),
      count: undefined,
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("pages.gear.title")}
        intro={t("gear.intro", { country: country.name })}
      />
      <ul className="grid gap-3 md:grid-cols-3">
        {tiles.map((x) => (
          <li key={x.href} className={card}>
            <Link href={x.href} className="font-condensed text-[1.375rem] font-bold">
              {x.title}
            </Link>
            <p className="mt-1 text-muted-strong">{x.text}</p>
            {x.count !== undefined && (
              <p className="mt-1 text-[0.875rem] font-semibold">{x.count}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
