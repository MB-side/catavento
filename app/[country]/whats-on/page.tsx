import { CountryPage, countryPageMetadata } from "@/components/layout/CountryPage";

export function generateMetadata({ params }: PageProps<"/[country]/whats-on">) {
  return countryPageMetadata(params, "whatsOn");
}

export default function Page({ params }: PageProps<"/[country]/whats-on">) {
  return <CountryPage params={params} page="whatsOn" />;
}
