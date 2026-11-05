import { enabledCountryParams } from "@/lib/country";
import Link from "next/link";
import { notFound } from "next/navigation";
import { card, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { Anchor } from "@/components/ui/anchor";
import { type BrandGroupKey, groupBrands, OTHER_GROUPS, sortMakes } from "@/lib/brand-groups";
import { orgPath } from "@/lib/clubs";
import { countryFromParams } from "@/lib/country";
import { getBrands, getOrganisation } from "@/lib/data";
import { t, tOr } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import type { Brand, DistributorRole, Organisation } from "@/lib/types";

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
  const mainGroups = groupBrands(main);
  // Instruments, radios, helmets and other gear: the brand's own list, plus the businesses here
  // that sell it, as the brand or the business publishes (D84, D98).
  const sellers = new Map<string, Seller[]>(
    all.map((b) => [
      b.id,
      b.distributors
        .flatMap((d) => {
          const org = getOrganisation(d.orgId);
          return org && org.country === country.code ? [{ org, role: d.role, basis: d.basis }] : [];
        })
        .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)),
    ]),
  );
  const other = all.filter(
    (b) => !b.officialList && (b.dealerPage || b.website || (sellers.get(b.id)?.length ?? 0) > 0),
  );
  const otherGroups = groupBrands(other, OTHER_GROUPS);
  const ungrouped = other
    .filter((b) => !b.makes?.length)
    .sort((a, b) => a.name.localeCompare(b.name));
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
        <GroupNav
          groups={mainGroups}
          label={t("gear.groupsNav")}
          extra={{ href: "#brands-a-z", label: t("gear.allBrandsShort") }}
        />
        {mainGroups.map((g) => (
          <GroupSection key={g.key} group={g} countryCode={country.code} />
        ))}
        {mainGroups.length > 0 && (
          <p className="text-[0.9375rem] text-muted">{t("gear.groupsNote")}</p>
        )}
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
      <section aria-labelledby="other-brands" className="flex flex-col gap-4" data-testid="brands">
        <h2 id="other-brands" className="font-condensed text-[1.5rem] font-bold">
          {t("gear.otherBrandsHeading")}
        </h2>
        <p>{t("gear.otherBrandsIntro", { country: country.name })}</p>
        <GroupNav groups={otherGroups} label={t("gear.otherGroupsNav")} />
        {otherGroups.map((g) => (
          <GroupSection key={g.key} group={g} countryCode={country.code} sellers={sellers} />
        ))}
        {ungrouped.length > 0 && (
          <section
            aria-labelledby="brands-more-title"
            className="flex flex-col gap-3"
            data-testid="brand-group"
          >
            <h3 id="brands-more-title" className="font-condensed text-[1.375rem] font-bold">
              {t("gear.moreBrandsHeading")}
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ungrouped.map((b) => (
                <BrandCard
                  key={b.id}
                  brand={b}
                  countryCode={country.code}
                  sellers={sellers.get(b.id)}
                />
              ))}
            </ul>
          </section>
        )}
        <p className="text-[0.9375rem] text-muted">{t("gear.otherNote")}</p>
        <Link
          href={`/${country.code.toLowerCase()}/gear/shops`}
          className="self-start font-semibold"
        >
          {t("gear.findByType")}
        </Link>
      </section>
    </div>
  );
}

interface Seller {
  org: Organisation;
  role: DistributorRole;
  basis: "brand" | "self";
}

/** Buttons that jump to each group on the page, with how many brands it has. */
function GroupNav({
  groups,
  label,
  extra,
}: {
  groups: { key: BrandGroupKey; brands: Brand[] }[];
  label: string;
  extra?: { href: string; label: string };
}) {
  if (groups.length === 0) return null;
  return (
    <nav aria-label={label} data-testid="brand-group-nav">
      <ul className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <li key={g.key}>
            <a href={`#brands-${g.key}`} className={linkButton}>
              {t(`gear.group.${g.key}.title`)}
              <span className="text-[0.875rem] font-normal text-muted">{g.brands.length}</span>
            </a>
          </li>
        ))}
        {extra && (
          <li>
            <a href={extra.href} className={linkButton}>
              {extra.label}
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}

function GroupSection({
  group,
  countryCode,
  sellers,
}: {
  group: { key: BrandGroupKey; brands: Brand[] };
  countryCode: string;
  sellers?: Map<string, Seller[]>;
}) {
  return (
    <section
      id={`brands-${group.key}`}
      aria-labelledby={`brands-${group.key}-title`}
      className="flex scroll-mt-24 flex-col gap-3"
      data-testid="brand-group"
    >
      <div>
        <h3 id={`brands-${group.key}-title`} className="font-condensed text-[1.375rem] font-bold">
          {t(`gear.group.${group.key}.title`)}
        </h3>
        <p className="text-muted">{t(`gear.group.${group.key}.text`)}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {group.brands.map((b) => (
          <BrandCard key={b.id} brand={b} countryCode={countryCode} sellers={sellers?.get(b.id)} />
        ))}
      </ul>
    </section>
  );
}

/** One brand: what it makes, where it is based, its own dealer list, and who sells it here (D98). */
function BrandCard({
  brand,
  countryCode,
  sellers,
}: {
  brand: Brand;
  countryCode: string;
  sellers?: Seller[];
}) {
  const local = brand.basedIn === countryCode;
  return (
    <li className={`${card} flex flex-col gap-2`} data-testid="brand-card">
      <div>
        <h4 className="text-[1.0625rem] font-bold">{brand.name}</h4>
        {brand.basedIn && (
          <p className={`text-[0.875rem] ${local ? "font-semibold text-good-text" : "text-muted"}`}>
            {regionNames.of(brand.basedIn) ?? brand.basedIn}
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
      {sellers && sellers.length > 0 && (
        <div className="text-[0.9375rem]">
          <p className="font-semibold">{t("gear.soldHere")}</p>
          <ul className="flex flex-col gap-0.5">
            {sellers.map(({ org, role, basis }) => (
              <li key={`${org.id}${role}`}>
                <Link href={orgPath(org)}>{org.name}</Link>{" "}
                <span className="text-[0.8125rem] text-muted">
                  · {tOr(`gear.role.${role}`, "gear.role.dealer")}
                  {" · "}
                  {basis === "brand"
                    ? t("gear.basisBrand", { brand: brand.name })
                    : t("gear.basisSelf")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-auto pt-1">
        {brand.dealerPage ? (
          <Anchor href={brand.dealerPage.url} className="font-semibold">
            {t(brand.officialList ? "gear.dealersButton" : "gear.brandDealersButton")}
            <span className="sr-only"> {t("gear.forBrand", { brand: brand.name })}</span>
          </Anchor>
        ) : brand.website ? (
          <>
            {brand.officialList && (
              <span className="text-[0.9375rem] text-muted">{t("gear.noDealerShort")} </span>
            )}
            <Anchor href={brand.website} className="font-semibold">
              {t(brand.officialList ? "gear.contactBrand" : "gear.brandWebsite")}
              <span className="sr-only"> {brand.name}</span>
            </Anchor>
          </>
        ) : null}
      </p>
    </li>
  );
}
