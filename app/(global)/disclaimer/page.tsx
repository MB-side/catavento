import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.disclaimer.title"),
  description: t("pages.disclaimer.summary"),
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return <ComingSoon title={t("pages.disclaimer.title")} summary={t("pages.disclaimer.summary")} />;
}
