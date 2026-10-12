import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.search.title"),
  description: t("pages.search.summary"),
  path: "/search",
});

export default function SearchPage() {
  return <ComingSoon title={t("pages.search.title")} summary={t("pages.search.summary")} />;
}
