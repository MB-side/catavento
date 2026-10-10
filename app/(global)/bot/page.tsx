import { ComingSoon } from "@/components/layout/ComingSoon";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.bot.title"),
  description: t("pages.bot.summary"),
  path: "/bot",
});

export default function BotPage() {
  return <ComingSoon title={t("pages.bot.title")} summary={t("pages.bot.summary")} />;
}
