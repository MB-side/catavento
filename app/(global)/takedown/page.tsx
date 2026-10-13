import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PolicySection } from "@/components/layout/PolicySection";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";
import { Anchor } from "@/components/ui/anchor";

export const metadata = pageMetadata({
  title: t("pages.takedown.title"),
  description: t("pages.takedown.summary"),
  path: "/takedown",
});

/** Takedown (docs/07 §8): how to get anything changed or removed, usually within 24 hours. */
export default function TakedownPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("pages.takedown.title")} intro={t("takedown.intro")} />
      <PolicySection id="what" heading={t("takedown.whatHeading")}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("takedown.what1")}</li>
          <li>{t("takedown.what2")}</li>
          <li>{t("takedown.what3")}</li>
        </ul>
      </PolicySection>
      <PolicySection id="how" heading={t("takedown.howHeading")}>
        <p>{t("takedown.howText")}</p>
        <p className="flex flex-wrap gap-x-4">
          <Anchor href={siteConfig.correctionForm.url}>{t("takedown.formLink")}</Anchor>
          <Anchor href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</Anchor>
        </p>
      </PolicySection>
      <PolicySection id="owners" heading={t("takedown.ownersHeading")}>
        <p>{t("takedown.ownersText")}</p>
        <p>
          <Link href="/bot">{t("pages.bot.title")}</Link>
        </p>
      </PolicySection>
    </div>
  );
}
