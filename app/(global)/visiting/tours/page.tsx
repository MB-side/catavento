import { TourList } from "@/components/domain/TourList";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTourOperators } from "@/lib/data";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { visitingPath } from "@/lib/visiting";
import { countryLookups } from "@/lib/visiting-pages";

export const metadata = pageMetadata({
  title: t("pages.tours.title"),
  description: t("pages.tours.summary"),
  path: "/visiting/tours",
});

/** Flying tours (D89): every tour operator found, with where its trips go. */
export default function ToursPage() {
  const { names, pages } = countryLookups();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("pages.tours.title")}
        intro={t("visiting.toursPageIntro")}
        crumb={{ href: `${visitingPath()}/`, label: t("pages.visiting.title") }}
      />
      <TourList tours={getTourOperators()} names={names} pages={pages} />
      <p className="rounded-[14px] bg-notice-tint p-4 text-notice-text">{t("site.disclaimer")}</p>
    </div>
  );
}
