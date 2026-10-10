import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.sources.title"),
  description: t("pages.sources.summary"),
  path: "/sources",
});

export default function SourcesPage() {
  return <ComingSoon title={t("pages.sources.title")} summary={t("pages.sources.summary")} />;
}
