import { enabledCountryParams } from "@/lib/country";
import Link from "next/link";
import { notFound } from "next/navigation";
import { card, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { Anchor } from "@/components/ui/anchor";
import { groupBrands, sortMakes } from "@/lib/brand-groups";
import { orgPath } from "@/lib/clubs";
import { countryFromParams } from "@/lib/country";
import { getBrands, getOrganisation } from "@/lib/data";
import { t, tOr } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import type { Brand } from "@/lib/types";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

// Only Australia and New Zealand have this section; other countries have one page (D93).
export function generateStaticParams() {
  return enabledCountryParams();
}

export async function generateMetadata({ params }: PageProps<"/[country]/gear/where-to-buy">) {
  const country = await countryFromParams(params);
  return pageMetadata({
    title: `${t("gear.whereTitle")} · ${country?.name ?? ""}`,
    description: t("gear.whereText", { country: country?.name ?? "" }),
    path: `/${country?.code.toLowerCase()}/gear/where-to-buy`,
  });
}

/** Where to buy (docs/02 §5.8): each brand and the businesses that import, sell or service it. */
// Importers first, then dealers, then service (D84).
const ROLE_ORDER = [
  "official_importer",
  "core_importer",
  "dealer",
  "service_agent",
  "certified_service",
] as const;

export default async function WhereToBuyPage({
  params,
}: PageProps<"/[country]/gear/where-to-buy">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const all = getBrands();
  // Wings, harnesses, reserves, hang gliders, paramotors: the brand's own list is the source (D95).
  const main = all
    .filter((b) => b.officialList && (b.dealerPage || b.website))
    .sort((a, b) => a.name.localeCompare(b.name));
  const groups = groupBrands(main);
  const brands = all
    .filter((b) => !b.officialList)
    .map((b) => ({
      brand: b,
      who: b.distributors
        .map((d) => ({ org: getOrganisation(d.orgId), role: d.role, basis: d.basis }))
        .filter((x) => x.org?.country === country.code)
        .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)),
    }))
    .filter((x) => x.who.length > 0);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("gear.whereTitle")}
        intro={t("gear.whereText", { country: country.name })}
        crumb={{ href: `/${country.code.toLowerCase()}/gear`, label: t("pages.gear.title") }}
      />
      <section aria-labelledby="main-brands" className="flex flex-col gap-4">
        <h2 id="main-brands" className="font-condensed text-[1.5rem] font-bold">
          {t("gear.mainBrandsHeading")}
        </h2>
        <p>{t("gear.mainBrandsIntro")}</p>
        {groups.length > 0 && (
          <nav aria-label={t("gear.groupsNav")} data-testid="brand-group-nav">
            <ul className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <li key={g.key}>
                  <a href={`#brands-${g.key}`} className={linkButton}>
                    {t(`gear.group.${g.key}.title`)}
                    <span className="text-[0.875rem] font-normal text-muted">
                      {g.brands.length}
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a href="#brands-a-z" className={linkButton}>
                  {t("gear.allBrandsShort")}
                </a>
              </li>
            </ul>
          </nav>
        )}
        {groups.map((g) => (
          <section
            key={g.key}
            id={`brands-${g.key}`}
            aria-labelledby={`brands-${g.key}-title`}
            className="flex scroll-mt-24 flex-col gap-3"
            data-testid="brand-group"
          >
            <div>
              <h3 id={`brands-${g.key}-title`} className="font-condensed text-[1.375rem] font-bold">
                {t(`gear.group.${g.key}.title`)}
              </h3>
              <p className="text-muted">{t(`gear.group.${g.key}.text`)}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.brands.map((b) => (
                <BrandCard key={b.id} brand={b} countryCode={country.code} />
              ))}
            </ul>
          </section>
        ))}
        {groups.length > 0 && <p className="text-[0.9375rem] text-muted">{t("gear.groupsNote")}</p>}
        <section
          id="brands-a-z"
          aria-labelledby="brands-a-z-title"
          className="flex scroll-mt-24 flex-col gap-3"
        >
          <h3 id="brands-a-z-title" className="font-condensed text-[1.375rem] font-bold">
            {t("gear.allBrandsHeading")}
          </h3>
          <ul
            className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="main-brands"
          >
            {main.map((b) => (
              <li key={b.id}>
                <span className="font-semibold">{b.name}</span>
                {": "}
                {b.dealerPage ? (
                  <Anchor href={b.dealerPage.url}>{t("gear.officialDealers")}</Anchor>
                ) : (
                  <>
                    {t("gear.noDealerList")}{" "}
                    <Anchor href={b.website}>{t("gear.contactBrand")}</Anchor>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </section>
      <h2 className="font-condensed text-[1.5rem] font-bold">{t("gear.otherBrandsHeading")}</h2>
      {brands.length === 0 ? (
        <p className={card}>{t("gear.noneYet", { country: country.name })}</p>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="brands">
            {brands.map(({ brand, who }) => (
              <li key={brand.id} className={card}>
                <h3 className="font-condensed text-[1.375rem] font-bold">{brand.name}</h3>
                <ul className="mt-1 flex flex-col gap-1">
                  {who.map(({ org, role, basis }) =>
                    org ? (
                      <li key={`${org.id}${role}`}>
                        <Link href={orgPath(org)}>{org.name}</Link>{" "}
                        <span className="text-[0.875rem] text-muted">
                          · {tOr(`gear.role.${role}`, "gear.role.dealer")}
                          {" · "}
                          {basis === "brand"
                            ? t("gear.basisBrand", { brand: brand.name })
                            : t("gear.basisSelf")}
                        </span>
                      </li>
                    ) : null,
                  )}
                </ul>
                {brand.dealerPage && (
                  <p className="mt-2 text-[0.9375rem]">
                    <Anchor href={brand.dealerPage.url}>
                      {t("gear.dealerPage", { brand: brand.name })}
                    </Anchor>
                  </p>
                )}
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

/** One main brand: what it makes, where it is based, and its own dealer list (D98). */
function BrandCard({ brand, countryCode }: { brand: Brand; countryCode: string }) {
  const local = brand.basedIn === countryCode;
  return (
    <li className={`${card} flex flex-col gap-2`} data-testid="brand-card">
      <div>
        <h4 className="text-[1.0625rem] font-bold">{brand.name}</h4>
        {brand.basedIn && (
          <p className={`text-[0.875rem] ${local ? "font-semibold text-good-text" : "text-muted"}`}>
            {t("gear.basedIn", { country: regionNames.of(brand.basedIn) ?? brand.basedIn })}
          </p>
        )}
      </div>
      {brand.makes && brand.makes.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("gear.makesLabel")}>
          {sortMakes(brand.makes).map((m) => (
            <li
              key={m}
              className="rounded-full bg-info-tint px-2.5 py-0.5 text-[0.8125rem] text-link"
            >
              {t(`gear.make.${m}`)}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto pt-1">
        {brand.dealerPage ? (
          <Anchor href={brand.dealerPage.url} className="font-semibold">
            {t("gear.dealersButton")}
            <span className="sr-only"> {t("gear.forBrand", { brand: brand.name })}</span>
          </Anchor>
        ) : (
          <>
            <span className="text-[0.9375rem] text-muted">{t("gear.noDealerShort")} </span>
            <Anchor href={brand.website} className="font-semibold">
              {t("gear.contactBrand")}
              <span className="sr-only"> {brand.name}</span>
            </Anchor>
          </>
        )}
      </p>
    </li>
  );
}
