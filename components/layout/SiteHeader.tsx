import Link from "next/link";
import { Lockup } from "@/components/brand/Logo";
import { t } from "@/lib/messages";
import { getCountryProfiles } from "@/lib/country-profile";
import { isGroup } from "@/lib/overview";
import { CountrySwitcher, type SwitcherGroup } from "./CountrySwitcher";
import { DesktopNav, PhoneTopActions, SearchLink } from "./SiteNav";

/** The switcher's choices: the countries with sections first, then each region, then the rest. */
function switcherGroups(): SwitcherGroup[] {
  const profiles = getCountryProfiles();
  const pick = (list: typeof profiles) => list.map((p) => ({ code: p.code, name: p.name }));
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  const regions = [
    ...new Map(
      profiles.flatMap((p) => (p.region && isGroup(p.region) ? [[p.region.slug, p.region]] : [])),
    ).values(),
  ];
  return [
    { label: t("visiting.homeHeading"), countries: pick(profiles.filter((p) => p.country)) },
    ...regions.map((r) => ({
      label: r.name,
      countries: pick(profiles.filter((p) => p.region?.slug === r.slug)).sort(byName),
    })),
    {
      label: t("visiting.otherHeading"),
      countries: pick(profiles.filter((p) => !p.country && (!p.region || !isGroup(p.region)))).sort(
        byName,
      ),
    },
  ];
}

/** Top bar: desktop shows the full lockup and navigation; phone shows name, New to flying and menu. */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface" data-testid="site-header">
      <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-4 px-4 py-2 lg:px-6 lg:py-3">
        <Link
          href="/"
          aria-label={t("brand.homeLink")}
          className="inline-flex min-h-11 items-center"
        >
          <Lockup className="lg:hidden" />
          <Lockup withDescriptor className="hidden lg:inline-flex" />
        </Link>
        <DesktopNav />
        <SearchLink className="hidden lg:inline-flex" />
        <PhoneTopActions />
      </div>
      <div className="border-t border-border bg-ground/60">
        <div className="mx-auto flex max-w-[80rem] items-center px-4 py-1.5 lg:px-6">
          <CountrySwitcher groups={switcherGroups()} />
        </div>
      </div>
    </header>
  );
}
