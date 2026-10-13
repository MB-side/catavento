import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getGuide, getOverviewRegions, getOverviewSites } from "@/lib/data";
import { t, tCount } from "@/lib/messages";
import { isGroup, worldPath } from "@/lib/overview";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.world.title"),
  description: t("pages.world.summary"),
  path: "/world",
});

/** Flying elsewhere (D83): the overview regions beyond Australia and New Zealand. */
export default function WorldPage() {
  const regions = getOverviewRegions();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("pages.world.title")} intro={t("world.intro")} />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="world-regions">
        {regions.map((r) => {
          const codes = new Set(r.countries.map((c) => c.code));
          const sites = getOverviewSites().filter((s) => codes.has(s.country)).length;
          const body = isGroup(r) ? undefined : getGuide(r.countries[0]?.code ?? "")?.nationalBody;
          return (
            <li key={r.slug}>
              <Link
                href={`${worldPath(r)}/`}
                className="flex h-full min-h-11 items-center justify-between gap-3 rounded-[14px] border border-border bg-surface p-4 text-ink hover:border-link hover:text-ink"
              >
                <span>
                  <span className="block font-condensed text-[1.25rem] font-bold">{r.name}</span>
                  <span className="block text-[0.875rem] text-muted">
                    {[
                      isGroup(r)
                        ? t("world.countriesCount", { count: String(r.countries.length) })
                        : body?.name,
                      sites > 0 ? tCount("counts.sites", sites) : undefined,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <ArrowRight className="size-6 shrink-0 text-action" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
