import { MySitesList } from "@/components/domain/MySitesList";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata = pageMetadata({
  title: t("pages.mySites.title"),
  description: t("pages.mySites.summary"),
  path: "/my-sites",
});

export default function MySitesPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-condensed text-[2rem] leading-tight font-bold">
          {t("pages.mySites.title")}
        </h1>
        <p className="mt-2 text-[1.0625rem]">{t("mySites.intro")}</p>
      </header>
      <MySitesList sitesHref={`/${siteConfig.defaultCountry.toLowerCase()}/sites`} />
      <p className="text-[0.9375rem] text-muted">{t("mySites.comingNext")}</p>
      <p className="rounded-[14px] bg-info-tint p-4 text-[0.9375rem] text-muted-strong">
        {t("site.disclaimer")}
      </p>
    </div>
  );
}
