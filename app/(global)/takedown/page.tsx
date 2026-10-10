import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.takedown.title"),
  description: t("pages.takedown.summary"),
  path: "/takedown",
});

export default function TakedownPage() {
  return <ComingSoon title={t("pages.takedown.title")} summary={t("pages.takedown.summary")} />;
}
