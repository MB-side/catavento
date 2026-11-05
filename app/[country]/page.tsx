import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountryProfilePage } from "@/components/domain/CountryProfilePage";
import { getCountryProfile } from "@/lib/country-profile";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[country]">): Promise<Metadata> {
  const profile = getCountryProfile((await params).country);
  if (!profile) return {};
  return pageMetadata({
    title: t("countryPage.title", { country: profile.name }),
    description: t("countryPage.summary", { country: profile.name }),
    path: `/${profile.code.toLowerCase()}`,
  });
}

/** A country's page (D93): the same eight sections for every country. */
export default async function CountryPage({ params }: PageProps<"/[country]">) {
  const profile = getCountryProfile((await params).country);
  if (!profile) notFound();
  return <CountryProfilePage profile={profile} />;
}
