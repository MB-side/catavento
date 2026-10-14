import { PageHeader } from "@/components/layout/PageHeader";
import { PolicySection } from "@/components/layout/PolicySection";
import { analyticsScript } from "@/lib/analytics";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";
import { Anchor } from "@/components/ui/anchor";

export const metadata = pageMetadata({
  title: t("pages.privacy.title"),
  description: t("pages.privacy.summary"),
  path: "/privacy",
});

const GITHUB_DATA =
  "https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#data-collection";

/** Privacy (docs/07 §8). Not legal advice. */
export default function PrivacyPage() {
  const counting = analyticsScript(siteConfig.analytics) !== null;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("pages.privacy.title")} intro={t("privacy.intro")} />
      <PolicySection id="accounts" heading={t("privacy.accountsHeading")}>
        <p>{t(counting ? "privacy.accountsTextCounting" : "privacy.accountsText")}</p>
      </PolicySection>
      {counting && (
        <PolicySection id="counting" heading={t("privacy.countingHeading")}>
          <p>{t("privacy.countingText")}</p>
        </PolicySection>
      )}
      <PolicySection id="device" heading={t("privacy.deviceHeading")}>
        <p>{t("privacy.deviceText")}</p>
      </PolicySection>
      <PolicySection id="services" heading={t("privacy.servicesHeading")}>
        <p>{t("privacy.servicesIntro")}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("privacy.openMeteo")}</li>
          <li>{t("privacy.openFreeMap")}</li>
          <li>{t("privacy.windy")}</li>
          <li>{t("privacy.links")}</li>
        </ul>
      </PolicySection>
      <PolicySection id="feedback" heading={t("privacy.feedbackHeading")}>
        <p>{t("privacy.feedbackText")}</p>
      </PolicySection>
      <PolicySection id="people" heading={t("privacy.peopleHeading")}>
        <p>{t("privacy.peopleText")}</p>
      </PolicySection>
      <PolicySection id="hosting" heading={t("privacy.hostingHeading")}>
        <p>{t("privacy.hostingText")}</p>
        <p>
          <Anchor href={GITHUB_DATA}>{t("privacy.hostingLink")}</Anchor>
        </p>
      </PolicySection>
      <PolicySection id="contact" heading={t("privacy.contactHeading")}>
        <p>
          {t("privacy.contactText")}{" "}
          <Anchor href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</Anchor>
        </p>
      </PolicySection>
    </div>
  );
}
