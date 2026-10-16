// "Help on the ground" (D89): businesses whose own websites say they help visiting pilots, with
// what they offer and where the facts came from.
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { t, tOr } from "@/lib/messages";
import type { VisitorHelp } from "@/lib/types";
import { serviceCounts, sortHelp, sortServices } from "@/lib/visiting";
import { Anchor } from "@/components/ui/anchor";

const chip = "rounded-full bg-info-tint px-2.5 py-0.5 text-[0.8125rem] font-semibold text-link";

/** `orgHrefs` maps directory organisation IDs to their Catavento page. */
export function VisitorHelpList({
  help,
  orgHrefs = {},
}: {
  help: VisitorHelp[];
  orgHrefs?: Record<string, string>;
}) {
  if (help.length === 0) return <p className="text-muted-strong">{t("visiting.helpNone")}</p>;
  const counts = serviceCounts(help);
  return (
    <div className="flex flex-col gap-4" data-testid="visitor-help">
      <p className="text-[0.9375rem]">
        <span className="font-semibold">{t("visiting.offered")}:</span>{" "}
        {counts
          .map(
            ({ service, count }) =>
              `${tOr(`visiting.services.${service}`, "visiting.services.guiding")} (${count})`,
          )
          .join(" · ")}
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {sortHelp(help).map((h) => {
          const inDirectory = h.orgId ? orgHrefs[h.orgId] : undefined;
          return (
            <li
              key={h.id}
              className="flex flex-col gap-2 rounded-[14px] border border-border bg-surface p-4"
            >
              <p className="font-condensed text-[1.25rem] leading-tight font-bold">
                {inDirectory ? (
                  <Link href={inDirectory}>{h.name}</Link>
                ) : h.website ? (
                  <Anchor href={h.website}>{h.name}</Anchor>
                ) : (
                  h.name
                )}
              </p>
              {h.area && <p className="text-[0.9375rem] text-muted-strong">{h.area}</p>}
              <ul className="flex flex-wrap gap-1.5" aria-label={t("visiting.offered")}>
                {sortServices(h.services).map((s) => (
                  <li key={s} className={chip}>
                    {tOr(`visiting.services.${s}`, "visiting.services.guiding")}
                  </li>
                ))}
              </ul>
              {h.note && <p className="text-[0.9375rem]">{h.note}</p>}
              <p className="mt-auto text-[0.8125rem] text-muted">
                <Anchor href={h.source}>
                  {t("visiting.sourceLine", { name: h.name, date: formatDate(h.checked, "UTC") })}
                </Anchor>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
