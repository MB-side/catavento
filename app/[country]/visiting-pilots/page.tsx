import { CountryPage, countryPageMetadata } from "@/components/layout/CountryPage";

export function generateMetadata({ params }: PageProps<"/[country]/visiting-pilots">) {
  return countryPageMetadata(params, "visitingPilots");
}

export default function Page({ params }: PageProps<"/[country]/visiting-pilots">) {
  return <CountryPage params={params} page="visitingPilots" />;
}
