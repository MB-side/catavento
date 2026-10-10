import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.status.title"),
  description: t("pages.status.summary"),
  path: "/status",
});

export default function StatusPage() {
  return <ComingSoon title={t("pages.status.title")} summary={t("pages.status.summary")} />;
}
