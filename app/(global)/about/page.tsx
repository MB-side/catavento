import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.about.title"),
  description: t("pages.about.summary"),
  path: "/about",
});

export default function AboutPage() {
  return <ComingSoon title={t("pages.about.title")} summary={t("pages.about.summary")} />;
}
