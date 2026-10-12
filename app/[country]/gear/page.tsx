import { CountryPage, countryPageMetadata } from "@/components/layout/CountryPage";

export function generateMetadata({ params }: PageProps<"/[country]/gear">) {
  return countryPageMetadata(params, "gear");
}

export default function Page({ params }: PageProps<"/[country]/gear">) {
  return <CountryPage params={params} page="gear" />;
}
