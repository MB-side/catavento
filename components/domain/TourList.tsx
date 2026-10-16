// Flying tour operators (D89): who runs organised trips for qualified pilots, and where to.
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/messages";
import type { TourOperator } from "@/lib/types";
import { Anchor } from "@/components/ui/anchor";

/**
 * `names` maps country codes to names; `pages` maps codes to their visiting page, so each
 * destination links to it when one exists.
 */
export function TourList({
  tours,
  names,
  pages,
  showDestinations = true,
}: {
  tours: TourOperator[];
  names: Record<string, string>;
  pages: Record<string, string>;
  showDestinations?: boolean;
}) {
  if (tours.length === 0) return <p className="text-muted-strong">{t("visiting.toursNone")}</p>;
  return (
    <ul className="grid gap-3 md:grid-cols-2" data-testid="tour-list">
      {tours.map((tour) => (
        <li
          key={tour.id}
          className="flex flex-col gap-2 rounded-[14px] border border-border bg-surface p-4"
        >
          <p className="font-condensed text-[1.25rem] leading-tight font-bold">
            <Anchor href={tour.website}>{tour.name}</Anchor>
          </p>
          <p className="text-[0.9375rem] text-muted-strong">
            {t("visiting.basedIn", { country: names[tour.basedIn] ?? tour.basedIn })}
          </p>
          {showDestinations && (
            <p className="text-[0.9375rem]">
              <span className="font-semibold">{t("visiting.tripsTo")}:</span>{" "}
              {tour.destinations.map((d, i) => (
                <span key={d}>
                  {i > 0 && ", "}
                  {pages[d] ? <Link href={pages[d]}>{names[d] ?? d}</Link> : (names[d] ?? d)}
                </span>
              ))}
            </p>
          )}
          {tour.forPilots && <p className="text-[0.9375rem]">{tour.forPilots}</p>}
          <p className="mt-auto text-[0.8125rem] text-muted">
            <Anchor href={tour.source}>
              {t("visiting.sourceLine", { name: tour.name, date: formatDate(tour.checked, "UTC") })}
            </Anchor>
          </p>
        </li>
      ))}
    </ul>
  );
}
