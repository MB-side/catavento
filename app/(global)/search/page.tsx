import { SearchPanel } from "@/components/domain/SearchPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.search.title"),
  description: t("pages.search.summary"),
  path: "/search",
});

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("pages.search.title")} intro={t("search.intro")} />
      <SearchPanel />
    </div>
  );
}
