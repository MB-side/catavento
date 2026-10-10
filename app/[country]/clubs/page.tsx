import { CountryPage, countryPageMetadata } from "@/components/layout/CountryPage";

export function generateMetadata({ params }: PageProps<"/[country]/clubs">) {
  return countryPageMetadata(params, "clubs");
}

export default function Page({ params }: PageProps<"/[country]/clubs">) {
  return <CountryPage params={params} page="clubs" />;
}
