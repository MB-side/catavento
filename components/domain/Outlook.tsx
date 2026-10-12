"use client";

// Outlook cells, strip (My Sites: 3 days × morning and afternoon) and grid (site page: 3 days ×
// every 2 hours, 06:00–20:00) per docs/02 §5.3 and docs/06 §6. Every cell carries text (compass
// point and speed), not just colour. Speeds are never judged unless the visitor set limits.
import { useEffect, useState, useSyncExternalStore } from "react";
import { t } from "@/lib/messages";
import { parseSettings, settingsSnapshot, subscribeMySites } from "@/lib/my-sites";
import {
  fetchForecasts,
  pickDays,
  speedIn,
  type Forecast,
  type ForecastPoint,
  type OutlookCellData,
  type OutlookDay,
} from "@/lib/outlook";
import type { WindArc } from "@/lib/types";
import { classifyWind, compassPoint, type WindClass } from "@/lib/wind";
import { cn } from "@/lib/utils";

export const STRIP_HOURS = [10, 14];
export const GRID_HOURS = [6, 8, 10, 12, 14, 16, 18, 20];

type State =
  | { status: "loading" }
  | { status: "ready"; forecasts: Map<string, Forecast> }
  | { status: "failed" };

/** Fetches forecasts for the given points once they're known; re-fetches if the set changes. */
export function useForecasts(points: ForecastPoint[]): State {
  const [state, setState] = useState<State>({ status: "loading" });
  const signature = points.map((p) => p.id).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    let live = true;
    fetchForecasts(points)
      .then((forecasts) => live && setState({ status: "ready", forecasts }))
      .catch(() => live && setState({ status: "failed" }));
    return () => {
      live = false;
    };
    // `signature` stands for `points`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  return state;
}

/** The visitor's units and limits, kept in sync with the settings form. */
export function useSettings() {
  const snapshot = useSyncExternalStore(subscribeMySites, settingsSnapshot, () => "kmh||");
  return parseSettings(snapshot);
}

const CLASS_STYLE: Record<WindClass | "unrated", string> = {
  within: "bg-in-range text-white",
  marginal: "bg-marginal text-ink",
  outside: "bg-outside text-muted-strong",
  light: "bg-light-wind text-muted-strong border border-border",
  unrated: "bg-surface text-ink border border-border",
};

const CLASS_LABEL: Record<WindClass | "unrated", string> = {
  within: "outlook.within",
  marginal: "outlook.marginal",
  outside: "outlook.outside",
  light: "outlook.light",
  unrated: "outlook.unrated",
};

function OutlookCell({
  cell,
  ranges,
  rated,
}: {
  cell?: OutlookCellData;
  ranges: WindArc[] | "all";
  rated: boolean;
}) {
  const { units, min, max } = useSettings();
  if (!cell) {
    return (
      <span className="flex h-12 items-center justify-center rounded-[6px] bg-ground text-[0.75rem] text-muted">
        –
      </span>
    );
  }
  const cls: WindClass | "unrated" = rated
    ? classifyWind(cell.direction, cell.speed, ranges)
    : cell.speed < 5
      ? "light"
      : "unrated";
  const outsideLimits =
    (min !== undefined && cell.speed < min) || (max !== undefined && cell.speed > max);
  const point = cls === "light" ? t("outlook.lightShort") : compassPoint(cell.direction);
  const speed = speedIn(cell.speed, units);
  const unit = units === "kt" ? "kt" : "km/h";
  const label = `${cell.time.slice(11, 16)}: ${t(CLASS_LABEL[cls] as "outlook.within")}, ${compassPoint(cell.direction)} ${speed} ${unit}${outsideLimits ? `, ${t("outlook.outsideLimits")}` : ""}`;
  return (
    <span
      className={cn(
        "flex h-12 flex-col items-center justify-center rounded-[6px] font-condensed leading-none",
        CLASS_STYLE[cls],
        outsideLimits && "outline-2 outline-offset-[-3px] outline-ink outline-dashed",
      )}
      title={label}
      data-class={cls}
    >
      <span className="sr-only">{label}</span>
      <span className="text-[0.875rem] font-bold" aria-hidden="true">
        {point}
      </span>
      <span className="text-[0.8125rem] font-semibold" aria-hidden="true">
        {speed}
      </span>
    </span>
  );
}

function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function OutlookTable({
  days,
  hours,
  ranges,
  rated,
  compact,
}: {
  days: OutlookDay[];
  hours: number[];
  ranges: WindArc[] | "all";
  rated: boolean;
  compact: boolean;
}) {
  const hourLabel = (h: number) =>
    compact
      ? h < 12
        ? t("outlook.morning")
        : t("outlook.afternoon")
      : `${String(h).padStart(2, "0")}:00`;
  return (
    // The full grid scrolls sideways on phones; keyboard users can focus it to scroll (WCAG 2.1.1).
    <div
      className={cn(!compact && "overflow-x-auto")}
      {...(!compact ? { tabIndex: 0, role: "region", "aria-label": t("outlook.gridLabel") } : {})}
    >
      <table className="w-full border-separate border-spacing-1 text-center" data-testid="outlook">
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              {t("outlook.day")}
            </th>
            {hours.map((h) => (
              <th key={h} scope="col" className="text-[0.75rem] font-medium text-muted">
                {hourLabel(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th
                scope="row"
                className="pr-1 text-left font-condensed text-[0.875rem] font-semibold whitespace-nowrap"
              >
                {dayLabel(d.date)}
              </th>
              {d.cells.map((c, i) => (
                <td key={i} className={cn(!compact && "min-w-11")}>
                  <OutlookCell cell={c} ranges={ranges} rated={rated} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OutlookLegend({
  rated = true,
  includeUnrated = false,
}: {
  rated?: boolean;
  includeUnrated?: boolean; // a list mixing sites with and without a published range
}) {
  const { units, min, max } = useSettings();
  const items: [string, string][] = rated
    ? [
        [CLASS_STYLE.within, t("outlook.within")],
        [CLASS_STYLE.marginal, t("outlook.marginal")],
        [CLASS_STYLE.outside, t("outlook.outside")],
        [CLASS_STYLE.light, t("outlook.light")],
      ]
    : [[CLASS_STYLE.unrated, t("outlook.unrated")]];
  if (rated && includeUnrated) items.push([CLASS_STYLE.unrated, t("outlook.unrated")]);
  return (
    <div
      className="flex flex-col gap-1 text-[0.8125rem] text-muted-strong"
      data-testid="outlook-legend"
    >
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map(([style, label]) => (
          <li key={label} className="inline-flex items-center gap-1.5">
            <span className={cn("inline-block size-3 rounded-[3px]", style)} aria-hidden="true" />
            {label}
          </li>
        ))}
        {(min !== undefined || max !== undefined) && (
          <li className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-[3px] outline-2 outline-ink outline-dashed"
              aria-hidden="true"
            />
            {t("outlook.outsideLimits")}
          </li>
        )}
      </ul>
      <p>
        {t("outlook.units", { unit: units === "kt" ? "knots" : "km/h" })} ·{" "}
        <a href="https://open-meteo.com/">{t("outlook.attribution")}</a>
      </p>
    </div>
  );
}

interface OutlookProps {
  point: ForecastPoint;
  ranges: WindArc[] | "all";
  rated: boolean; // false when the site's range isn't published in a readable form
  state: State;
  compact?: boolean;
  wtfHref: string;
}

/** One site's outlook: loading, failed (with the Where To Fly link) or the strip/grid. */
export function SiteOutlook({
  point,
  ranges,
  rated,
  state,
  compact = false,
  wtfHref,
}: OutlookProps) {
  if (state.status === "loading") {
    return <p className="text-[0.875rem] text-muted">{t("outlook.loading")}</p>;
  }
  const forecast = state.status === "ready" ? state.forecasts.get(point.id) : undefined;
  if (!forecast) {
    return (
      <p className="text-[0.875rem] text-muted" data-testid="outlook-failed">
        {t("outlook.unavailable")} <a href={wtfHref}>{t("site.forecasts.wtf")}</a>
      </p>
    );
  }
  const hours = compact ? STRIP_HOURS : GRID_HOURS;
  return (
    <OutlookTable
      days={pickDays(forecast, hours)}
      hours={hours}
      ranges={ranges}
      rated={rated}
      compact={compact}
    />
  );
}
