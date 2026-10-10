import { notFound } from "next/navigation";
import { CoverageNotice } from "@/components/layout/CoverageNotice";
import { getCountry, getEnabledCountries } from "@/lib/country";

// Only the enabled countries exist; any other first segment is a 404 (static export).
export const dynamicParams = false;

export function generateStaticParams() {
  return getEnabledCountries().map((c) => ({ country: c.code.toLowerCase() }));
}

export default async function CountryLayout({ children, params }: LayoutProps<"/[country]">) {
  const { country: segment } = await params;
  const country = getCountry(segment);
  if (!country) notFound();
  return (
    <>
      <CoverageNotice country={country} />
      {children}
    </>
  );
}
