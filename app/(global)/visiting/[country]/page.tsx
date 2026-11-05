import { Forward } from "@/components/layout/Forward";
import { getCountryProfiles } from "@/lib/country-profile";
import { visitingHref } from "@/lib/visiting";

// Visiting pages became each country's own page (D93). The old address forwards there.
export const dynamicParams = false;

export function generateStaticParams() {
  return getCountryProfiles()
    .filter((p) => !p.country)
    .map((p) => ({ country: p.code.toLowerCase() }));
}

export default async function OldVisitingPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  return <Forward to={visitingHref({ code: (await params).country })} />;
}
