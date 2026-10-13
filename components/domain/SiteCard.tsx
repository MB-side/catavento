// A site in a list (sites list, club pages): wind rose, name, region and range, who manages it or
// who to contact, status. Club names link to club pages.
import Link from "next/link";
import { StarButton } from "@/components/domain/StarButton";
import { StatusChip } from "@/components/domain/StatusChip";
import { WindRose } from "@/components/domain/WindRose";
import { t } from "@/lib/messages";
import type { SiteSummary } from "@/lib/site-summary";

export function SiteCard({
  site: s,
  showOrg = true,
  children,
}: {
  site: SiteSummary;
  showOrg?: boolean;
  children?: React.ReactNode; // e.g. a "Remove" button
}) {
  const org = s.steward
    ? { label: "sitesList.managedBy" as const, name: s.steward, href: s.stewardHref }
    : s.contact
      ? { label: "sitesList.contact" as const, name: s.contact, href: s.contactHref }
      : undefined;
  return (
    <li
      className="flex gap-3 rounded-[14px] border border-border bg-surface p-4"
      data-testid="site-card"
    >
      <WindRose ranges={s.windRanges} marginal={s.windMarginal} size={48} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <Link href={s.href} className="font-condensed text-[1.25rem] leading-tight font-bold">
          {s.name}
        </Link>
        <p className="text-[0.875rem] text-muted">
          {[s.regionName, s.windParsed ? s.windLabel : undefined].filter(Boolean).join(" · ")}
        </p>
        {showOrg && org && (
          <p className="text-[0.875rem] text-muted-strong">
            {org.href ? (
              <>
                {t(org.label, { name: "" }).trim()} <Link href={org.href}>{org.name}</Link>
              </>
            ) : (
              t(org.label, { name: org.name })
            )}
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <StatusChip status={s.status} />
          {s.community && (
            <span className="rounded-full bg-prototype-tint px-2.5 py-0.5 text-[0.8125rem] font-semibold text-prototype-text">
              {t("sitesList.community")}
            </span>
          )}
        </div>
        {children}
      </div>
      <StarButton site={s} />
    </li>
  );
}
