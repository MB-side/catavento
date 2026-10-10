import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata = pageMetadata({
  title: t("pages.feedback.title"),
  description: t("pages.feedback.summary"),
  path: "/feedback",
});

/** Feedback: the external form when configured, otherwise the email fallback (docs/02 §10). */
export default function FeedbackPage() {
  const formUrl = siteConfig.feedbackFormUrl as string;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-condensed text-[2rem] leading-tight font-bold">
        {t("pages.feedback.title")}
      </h1>
      <p className="mt-2 text-[1.0625rem] text-muted">{t("pages.feedback.summary")}</p>
      <div className="mt-6 rounded-[14px] border border-border bg-surface p-4 lg:p-5">
        {formUrl ? (
          <a
            href={formUrl}
            className="inline-flex min-h-11 items-center rounded-[10px] bg-action px-4 font-semibold text-white hover:bg-action/90 hover:text-white"
          >
            {t("pages.feedback.formLink")}
          </a>
        ) : (
          <>
            <p>{t("pages.feedback.emailIntro")}</p>
            <p className="mt-2">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="inline-flex min-h-11 items-center text-[1.125rem] font-semibold underline underline-offset-4"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          </>
        )}
        <p className="mt-3 text-muted">{t("pages.feedback.includePage")}</p>
      </div>
    </div>
  );
}
