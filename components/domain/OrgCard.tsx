// A school, operator or shop in a list: name (to its profile), what it is, disciplines, where,
// a published price-from if any, and its website.
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { orgPath } from "@/lib/clubs";
import { formatDate } from "@/lib/format";
import { t, tOr } from "@/lib/messages";
import { formatPrice } from "@/lib/money";
import { isSchool } from "@/lib/gear";
import type { BrandLink, Offering, Organisation } from "@/lib/types";
import { Anchor } from "@/components/ui/anchor";

export function kindLabels(o: Organisation): string {
  return [o.kind, ...(o.additionalKinds ?? [])]
    .map((k) => tOr(`orgKinds.${k}`, "orgKinds.school"))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" · ");
}

export function disciplineLabels(o: Organisation): string {
  return o.disciplines.map((d) => tOr(`disciplines.${d}`, "disciplines.PG")).join(", ");
}

export function OrgCard({
  org,
  regionName,
  price,
  timeZone,
  brands = [],
  gearContext = false,
}: {
  org: Organisation;
  regionName?: string;
  price?: Offering;
  timeZone: string;
  brands?: BrandLink[];
  gearContext?: boolean; // on the Shops page: mark schools that sell gear
}) {
  const where = [org.locality, regionName].filter(Boolean).join(", ");
  return (
    <li
      className="flex flex-col gap-1 rounded-[14px] border border-border bg-surface p-4"
      data-testid="org-card"
    >
      <Link href={orgPath(org)} className="font-condensed text-[1.25rem] leading-tight font-bold">
        {org.name}
      </Link>
      {gearContext && isSchool(org) && (
        <span className="self-start rounded-full bg-info-tint px-2 py-0.5 text-[0.75rem] font-semibold text-link">
          {t("gear.alsoSchool")}
        </span>
      )}
      <p className="text-[0.875rem] text-muted">
        {[kindLabels(org), where].filter(Boolean).join(" · ")}
      </p>
      {org.disciplines.length > 0 && (
        <p className="text-[0.875rem] text-muted-strong">{disciplineLabels(org)}</p>
      )}
      {org.sells && org.sells.length > 0 && (
        <p className="text-[0.875rem]">
          <span className="font-semibold">{t("gear.sells")}:</span>{" "}
          {org.sells
            .map((c) => tOr(`gear.categories.${c}`, "gear.categories.paragliders"))
            .join(", ")}
          {org.sellsUsed && `, ${t("gear.usedToo")}`}
        </p>
      )}
      {brands.length > 0 && (
        <p className="text-[0.875rem]">
          <span className="font-semibold">{t("gear.brandsLabel")}:</span>{" "}
          {brands
            .map(
              (b) => `${b.name} (${tOr(`gear.role.${b.role}`, "gear.role.dealer").toLowerCase()})`,
            )
            .join(", ")}
        </p>
      )}
      {price?.priceFrom !== undefined && (
        <p className="text-[0.875rem]">
          <span className="font-semibold">
            {t("ntf.priceFrom", { price: formatPrice(price.priceFrom, price.currency) })}
          </span>{" "}
          <span className="text-muted">
            ({price.title},{" "}
            {t("ntf.priceSource", { date: formatDate(price.source.fetchedAt, timeZone) })})
          </span>
        </p>
      )}
      {org.website && (
        <Anchor
          href={org.website}
          className="mt-1 inline-flex min-h-11 items-center gap-1.5 self-start font-semibold"
        >
          {t("ntf.visitSite")}
          <span className="sr-only">: {org.name}</span>
          <ExternalLink className="size-4" aria-hidden="true" />
        </Anchor>
      )}
    </li>
  );
}
