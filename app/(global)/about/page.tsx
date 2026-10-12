import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PolicySection } from "@/components/layout/PolicySection";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata = pageMetadata({
  title: t("pages.about.title"),
  description: t("pages.about.summary"),
  path: "/about",
});

/** About (docs/07 §8). */
export default function AboutPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("pages.about.title")} intro={siteConfig.descriptor} />
      <PolicySection id="what" heading={t("about.whatHeading")}>
        <p>{t("about.whatText")}</p>
      </PolicySection>
      <PolicySection id="name" heading={t("about.nameHeading")}>
        <p>{siteConfig.whyTheName}</p>
      </PolicySection>
      <PolicySection id="independent" heading={t("about.independentHeading")}>
        <p>{t("about.independentText")}</p>
      </PolicySection>
      <PolicySection id="prototype" heading={t("about.prototypeHeading")}>
        <p>{t("about.prototypeText")}</p>
      </PolicySection>
      <PolicySection id="sources" heading={t("about.sourcesHeading")}>
        <p>{t("about.sourcesText")}</p>
        <p className="flex flex-wrap gap-x-4">
          <Link href="/sources">{t("pages.sources.title")}</Link>
          <Link href="/status">{t("pages.status.title")}</Link>
          <Link href="/bot">{t("pages.bot.title")}</Link>
        </p>
      </PolicySection>
      <PolicySection id="feedback" heading={t("about.feedbackHeading")}>
        <p>{t("about.feedbackText")}</p>
        <p>
          <Link href="/feedback">{t("pages.feedback.title")}</Link>
        </p>
      </PolicySection>
    </div>
  );
}
