// A school, operator or shop in a list: name (to its profile), what it is, disciplines, where,
// a published price-from if any, and its website.
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { orgPath } from "@/lib/clubs";
import { formatDate } from "@/lib/format";
import { t, tOr } from "@/lib/messages";
import { formatPrice } from "@/lib/money";
import type { Offering, Organisation } from "@/lib/types";

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
}: {
  org: Organisation;
  regionName?: string;
  price?: Offering;
  timeZone: string;
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
      <p className="text-[0.875rem] text-muted">
        {[kindLabels(org), where].filter(Boolean).join(" · ")}
      </p>
      {org.disciplines.length > 0 && (
        <p className="text-[0.875rem] text-muted-strong">{disciplineLabels(org)}</p>
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
        <a
          href={org.website}
          className="mt-1 inline-flex min-h-11 items-center gap-1.5 self-start font-semibold"
        >
          {t("ntf.visitSite")}
          <span className="sr-only">: {org.name}</span>
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
    </li>
  );
}
