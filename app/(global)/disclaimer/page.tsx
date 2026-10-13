import { PageHeader } from "@/components/layout/PageHeader";
import { PolicySection } from "@/components/layout/PolicySection";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: t("pages.disclaimer.title"),
  description: t("pages.disclaimer.summary"),
  path: "/disclaimer",
});

/** Disclaimer (docs/07 §2, §8). Not legal advice. */
export default function DisclaimerPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("pages.disclaimer.title")} />
      <PolicySection id="standard" heading={t("disclaimer.standardHeading")}>
        <p className="font-semibold">{t("site.disclaimer")}</p>
      </PolicySection>
      <PolicySection id="official" heading={t("disclaimer.officialHeading")}>
        <p>{t("disclaimer.officialText")}</p>
      </PolicySection>
      <PolicySection id="forecast" heading={t("disclaimer.forecastHeading")}>
        <p>{t("disclaimer.forecastText")}</p>
      </PolicySection>
      <PolicySection id="listings" heading={t("disclaimer.listingsHeading")}>
        <p>{t("disclaimer.listingsText")}</p>
      </PolicySection>
      <PolicySection id="advice" heading={t("disclaimer.adviceHeading")}>
        <p>{t("disclaimer.adviceText")}</p>
      </PolicySection>
    </div>
  );
}
