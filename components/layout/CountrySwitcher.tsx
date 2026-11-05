"use client";

// "Flying in: <country>" (D93): jumps to a country's page and becomes the country the navigation
// follows. Without JavaScript the Destinations tab lists every country instead.
import { useRouter } from "next/navigation";
import { t } from "@/lib/messages";
import { useCurrentCountry } from "./useCurrentCountry";

export interface SwitcherGroup {
  label: string;
  countries: { code: string; name: string }[];
}

export function CountrySwitcher({ groups }: { groups: SwitcherGroup[] }) {
  const router = useRouter();
  const { country } = useCurrentCountry();
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="country-switcher"
        className="text-[0.9375rem] font-semibold text-muted-strong"
      >
        {t("countryPage.switcherLabel")}
      </label>
      <select
        id="country-switcher"
        value={country.toUpperCase()}
        onChange={(e) => router.push(`/${e.target.value.toLowerCase()}/`)}
        className="min-h-11 max-w-[14rem] rounded-[10px] border border-border-strong bg-surface px-2 text-[0.9375rem] font-semibold text-ink"
        data-testid="country-switcher"
      >
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
