"use client";

// Shops with a "What are you after?" filter (founder request, D73): pick a kind of gear and see
// the businesses that say they sell it. Pre-rendered in full, so it works without JavaScript.
import { useState } from "react";
import { OrgCard } from "@/components/domain/OrgCard";
import { GEAR_CATEGORIES, type GearCategory } from "@/lib/gear";
import { t, tOr } from "@/lib/messages";
import type { Offering, Organisation } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GearExplorer({
  orgs,
  regionNames,
  prices,
  timeZone,
}: {
  orgs: Organisation[];
  regionNames: Record<string, string>;
  prices: Record<string, Offering | undefined>;
  timeZone: string;
}) {
  const [want, setWant] = useState<GearCategory | "">("");
  const offered = GEAR_CATEGORIES.filter((c) => orgs.some((o) => o.sells?.includes(c)));
  const shown = want ? orgs.filter((o) => o.sells?.includes(want)) : orgs;
  const form = new Intl.PluralRules("en").select(shown.length) === "one" ? "one" : "other";
  const chip = (on: boolean) =>
    cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 font-semibold",
      on ? "border-action bg-action-tint text-action" : "border-border-strong bg-surface text-ink",
    );
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="rounded-[14px] border border-border bg-surface p-4">
        <legend className="px-1 font-condensed text-[1.25rem] font-bold">
          {t("gear.filterHeading")}
        </legend>
        <div className="mt-1 flex flex-wrap gap-2" data-testid="gear-filter">
          <button
            type="button"
            aria-pressed={want === ""}
            onClick={() => setWant("")}
            className={chip(want === "")}
          >
            {t("gear.all")}
          </button>
          {offered.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={want === c}
              onClick={() => setWant(c)}
              className={chip(want === c)}
            >
              {tOr(`gear.categories.${c}`, "gear.categories.paragliders")}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[0.875rem] text-muted">{t("gear.specificNote")}</p>
      </fieldset>
      <p aria-live="polite" className="font-semibold" data-testid="gear-count">
        {tOr(`gear.matches.${form}`, "gear.matches.other", { count: String(shown.length) })}
      </p>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((o) => (
          <OrgCard
            key={o.id}
            org={o}
            regionName={o.regionCode ? regionNames[o.regionCode] : undefined}
            price={prices[o.id]}
            timeZone={timeZone}
          />
        ))}
      </ul>
      <p className="text-[0.875rem] text-muted">{t("gear.categoriesNote")}</p>
    </div>
  );
}
