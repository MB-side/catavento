"use client";

// What's on (docs/02 §5.7): upcoming events with region and type filters. Pre-rendered in full,
// so the list works without JavaScript.
import Link from "next/link";
import { useState } from "react";
import { t, tOr } from "@/lib/messages";
import { Anchor } from "@/components/ui/anchor";

export interface EventSummary {
  id: string;
  title: string;
  url: string;
  month: string;
  day: string;
  when: string; // "17 Oct 2026" or "17–18 Oct 2026"
  place?: string;
  regionCode?: string;
  type: string;
  organiser?: { name: string; href?: string };
}

const control =
  "min-h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-[1rem] text-ink";

export function EventsExplorer({
  events,
  regions,
  regionLabel,
}: {
  events: EventSummary[];
  regions: { code: string; name: string }[];
  regionLabel: string;
}) {
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const types = [...new Set(events.map((e) => e.type))];
  const shown = events.filter(
    (e) => (!region || e.regionCode === region) && (!type || e.type === type),
  );
  const form = new Intl.PluralRules("en").select(shown.length) === "one" ? "one" : "other";
  return (
    <div className="flex flex-col gap-4">
      {events.length > 1 && (
        <form
          className="grid gap-3 rounded-[14px] border border-border bg-surface p-4 sm:grid-cols-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
            {regionLabel}
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={control}>
              <option value="">{t("whatsOn.allRegions")}</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
            {t("whatsOn.type")}
            <select value={type} onChange={(e) => setType(e.target.value)} className={control}>
              <option value="">{t("whatsOn.allTypes")}</option>
              {types.map((x) => (
                <option key={x} value={x}>
                  {tOr(`whatsOn.types.${x}`, "whatsOn.types.other")}
                </option>
              ))}
            </select>
          </label>
        </form>
      )}
      <p aria-live="polite" className="font-semibold" data-testid="event-count">
        {tOr(`whatsOn.results.${form}`, "whatsOn.results.other", { count: String(shown.length) })}
      </p>
      {shown.length === 0 ? (
        <p className="rounded-[14px] border border-border bg-surface p-4">{t("whatsOn.none")}</p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="event-list">
          {shown.map((e) => (
            <li
              key={e.id}
              className="flex gap-3 rounded-[14px] border border-border bg-surface p-4"
            >
              <span className="flex w-14 shrink-0 flex-col items-center self-start rounded-[8px] bg-info-tint py-1.5 font-condensed leading-none font-bold text-link">
                <span className="text-[0.8125rem]">{e.month}</span>
                <span className="text-[1.625rem]">{e.day}</span>
              </span>
              <div className="min-w-0">
                <Anchor
                  href={e.url}
                  className="font-condensed text-[1.25rem] leading-tight font-bold"
                >
                  {e.title}
                </Anchor>
                <p className="text-[0.875rem] text-muted">
                  {[e.when, e.place, tOr(`whatsOn.types.${e.type}`, "whatsOn.types.other")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {e.organiser && (
                  <p className="text-[0.875rem] text-muted-strong">
                    {t("whatsOn.organiser", { name: "" }).trim()}{" "}
                    {e.organiser.href ? (
                      <Link href={e.organiser.href}>{e.organiser.name}</Link>
                    ) : (
                      e.organiser.name
                    )}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
