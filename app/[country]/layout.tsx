import { notFound } from "next/navigation";
import { CoverageNotice } from "@/components/layout/CoverageNotice";
import { getCountry } from "@/lib/country";
import { getCountryProfile, getCountryProfiles } from "@/lib/country-profile";

// Every country Catavento covers has a page (D93); any other first segment is a 404 (static export).
// Australia and New Zealand's sections limit themselves to those two countries.
export const dynamicParams = false;

export function generateStaticParams() {
  return getCountryProfiles().map((p) => ({ country: p.code.toLowerCase() }));
}

export default async function CountryLayout({ children, params }: LayoutProps<"/[country]">) {
  const { country: segment } = await params;
  if (!getCountryProfile(segment)) notFound();
  const country = getCountry(segment);
  return (
    <>
      {country && <CoverageNotice country={country} />}
      {children}
    </>
  );
}
