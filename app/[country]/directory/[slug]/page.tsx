import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { disciplineLabels, kindLabels } from "@/components/domain/OrgCard";
import { ReportCorrectionLink } from "@/components/layout/ReportCorrectionLink";
import { card, h2, linkButton } from "@/components/layout/PageHeader";
import { orgPath } from "@/lib/clubs";
import { getCountry, getEnabledCountries } from "@/lib/country";
import { getBrands, getOfferings, getOrganisation, getProvider } from "@/lib/data";
import { directoryOrgs } from "@/lib/directory";
import { formatDate } from "@/lib/format";
import { t, tOr } from "@/lib/messages";
import { formatPrice } from "@/lib/money";
import { absoluteUrl } from "@/lib/paths";
import { jsonLdScript, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getEnabledCountries().flatMap((c) =>
    directoryOrgs(c).map((o) => ({ country: c.code.toLowerCase(), slug: o.slug })),
  );
}

async function load(params: PageProps<"/[country]/directory/[slug]">["params"]) {
  const { country: c, slug } = await params;
  const country = getCountry(c);
  const org = country ? directoryOrgs(country).find((o) => o.slug === slug) : undefined;
  if (!country || !org) notFound();
  return { country, org };
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/directory/[slug]">): Promise<Metadata> {
  const { country, org } = await load(params);
  const region = org.regionCode ? country.regionNames[org.regionCode] : undefined;
  return pageMetadata({
    title: org.name,
    description: [kindLabels(org), org.locality, region].filter(Boolean).join(" · "),
    path: orgPath(org),
  });
}

/** Directory profile (docs/02 §4) for any organisation that isn't a club: facts as published. */
export default async function DirectoryProfile({
  params,
}: PageProps<"/[country]/directory/[slug]">) {
  const { country, org } = await load(params);
  const zone = country.timezones[0] ?? "UTC";
  const region = org.regionCode ? country.regionNames[org.regionCode] : undefined;
  const offerings = getOfferings(org.id);
  const brands = getBrands()
    .map((b) => ({
      brand: b,
      roles: b.distributors.filter((d) => d.orgId === org.id).map((d) => d.role),
    }))
    .filter((x) => x.roles.length > 0);
  const related = (org.relatedOrgIds ?? []).map(getOrganisation).filter((o) => o !== undefined);
  const body = country.nationalBody.shortName ?? country.nationalBody.name;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: org.name,
    url: absoluteUrl(orgPath(org)),
    ...(org.website ? { sameAs: [org.website] } : {}),
    ...(org.locality || region
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: org.locality,
            addressRegion: region,
            addressCountry: org.country,
          },
        }
      : {}),
  };

  return (
    <article className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <header className={card}>
        <h1 className="font-condensed text-[2rem] leading-tight font-bold lg:text-[2.5rem]">
          {org.name}
        </h1>
        <p className="mt-1 text-[1.0625rem] text-muted-strong">
          {[kindLabels(org), org.locality, region].filter(Boolean).join(" · ")}
        </p>
        {org.disciplines.length > 0 && <p className="mt-1">{disciplineLabels(org)}</p>}
        {org.nationalBodyListed && (
          <p className="mt-2">
            <span className="rounded-full bg-info-tint px-2.5 py-0.5 text-[0.8125rem] font-semibold text-link">
              {t("directory.listed", { body })}
            </span>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {org.website && (
            <a href={org.website} className={linkButton}>
              {t("directory.website")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
          {org.emailPublic && (
            <a href={`mailto:${org.emailPublic}`} className={linkButton}>
              <Mail className="size-4" aria-hidden="true" />
              {org.emailPublic}
            </a>
          )}
          {org.phonePublic && (
            <a href={`tel:${org.phonePublic.replace(/\s+/g, "")}`} className={linkButton}>
              <Phone className="size-4" aria-hidden="true" />
              {org.phonePublic}
            </a>
          )}
        </div>
      </header>

      {offerings.length > 0 && (
        <section aria-labelledby="offerings" className={card}>
          <h2 id="offerings" className={h2}>
            {t("directory.offeringsHeading")}
          </h2>
          <ul className="mt-2 flex flex-col gap-3">
            {offerings.map((o) => (
              <li key={o.title}>
                <p className="font-semibold">
                  {o.title}
                  {o.priceFrom !== undefined && ` · ${formatPrice(o.priceFrom, o.currency)}`}
                </p>
                {o.inclusions && <p className="text-muted-strong">{o.inclusions.join(", ")}</p>}
                <p className="text-[0.875rem] text-muted">
                  <a href={o.url}>
                    {t("directory.offeringSource", {
                      name: org.name,
                      date: formatDate(o.source.fetchedAt, zone),
                    })}
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {brands.length > 0 && (
        <section aria-labelledby="brands" className={card}>
          <h2 id="brands" className={h2}>
            {t("directory.brandsHeading")}
          </h2>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {brands.map(({ brand, roles }) => (
              <li key={brand.id}>
                <span className="font-semibold">{brand.name}</span>:{" "}
                {roles.map((r) => tOr(`gear.role.${r}`, "gear.role.dealer")).join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related" className={card}>
          <h2 id="related" className={h2}>
            {t("directory.relatedHeading")}
          </h2>
          <ul className="mt-2">
            {related.map((o) => (
              <li key={o.id}>
                <Link href={orgPath(o)}>{o.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {org.summary && (
        <section aria-labelledby="notes" className={card}>
          <h2 id="notes" className={h2}>
            {t("directory.notesHeading")}
          </h2>
          <p className="mt-2 text-muted-strong">{org.summary}</p>
        </section>
      )}

      <footer aria-labelledby="sources" className="text-[0.875rem] text-muted">
        <h2 id="sources" className="font-semibold text-muted-strong">
          {t("directory.sourcesHeading")}
        </h2>
        <ul className="mt-1 flex flex-col gap-0.5">
          {org.sources.map((s) => (
            <li key={`${s.providerId}${s.url}`}>
              <a href={s.url}>
                {getProvider(s.providerId)?.attribution.replace(/\{[^}]+\}/g, org.name) ??
                  s.providerId}
              </a>{" "}
              · {formatDate(s.fetchedAt, zone)}
            </li>
          ))}
        </ul>
        <p className="mt-2">
          <ReportCorrectionLink recordId={org.id} className="underline underline-offset-4" />
        </p>
      </footer>
    </article>
  );
}
