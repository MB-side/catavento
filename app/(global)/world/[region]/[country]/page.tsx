import { Forward } from "@/components/layout/Forward";
import { getOverviewRegions } from "@/lib/data";
import { isGroup } from "@/lib/overview";
import { visitingHref } from "@/lib/visiting";

// Overview country pages became each country's own page (D93). The old address forwards there.
export const dynamicParams = false;

export function generateStaticParams() {
  return getOverviewRegions()
    .filter(isGroup)
    .flatMap((r) => r.countries.map((c) => ({ region: r.slug, country: c.code.toLowerCase() })));
}

export default async function OldOverviewCountryPage({
  params,
}: {
  params: Promise<{ region: string; country: string }>;
}) {
  return <Forward to={visitingHref({ code: (await params).country })} />;
}
