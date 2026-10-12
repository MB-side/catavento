import { CountryPage, countryPageMetadata } from "@/components/layout/CountryPage";

export function generateMetadata({ params }: PageProps<"/[country]/sites">) {
  return countryPageMetadata(params, "sites");
}

export default function Page({ params }: PageProps<"/[country]/sites">) {
  return <CountryPage params={params} page="sites" />;
}
