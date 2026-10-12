import { CountryPage, countryPageMetadata } from "@/components/layout/CountryPage";

export function generateMetadata({ params }: PageProps<"/[country]">) {
  return countryPageMetadata(params, "countryHome");
}

export default function Page({ params }: PageProps<"/[country]">) {
  return <CountryPage params={params} page="countryHome" />;
}
