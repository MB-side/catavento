import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.mySites.title"),
  description: t("pages.mySites.summary"),
  path: "/my-sites",
});

export default function MySitesPage() {
  return <ComingSoon title={t("pages.mySites.title")} summary={t("pages.mySites.summary")} />;
}
