import { CountryPage, countryPageMetadata } from "@/components/layout/CountryPage";

export function generateMetadata({ params }: PageProps<"/[country]/new-to-flying">) {
  return countryPageMetadata(params, "newToFlying");
}

export default function Page({ params }: PageProps<"/[country]/new-to-flying">) {
  return <CountryPage params={params} page="newToFlying" />;
}
