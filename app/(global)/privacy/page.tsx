import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.privacy.title"),
  description: t("pages.privacy.summary"),
  path: "/privacy",
});

export default function PrivacyPage() {
  return <ComingSoon title={t("pages.privacy.title")} summary={t("pages.privacy.summary")} />;
}
