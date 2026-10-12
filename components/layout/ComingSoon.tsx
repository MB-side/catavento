import Link from "next/link";
import { t } from "@/lib/messages";

interface ComingSoonProps {
  title: string;
  summary: string;
  children?: React.ReactNode;
}

/** Honest placeholder for sections not built yet: says what the page is for, invents nothing. */
export function ComingSoon({ title, summary, children }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-condensed text-[2rem] leading-tight font-bold">{title}</h1>
      <p className="mt-2 text-[1.0625rem] text-muted">{summary}</p>
      {children}
      <div className="mt-6 rounded-[14px] border border-border bg-surface p-4 lg:p-5">
        <p className="font-medium">{t("comingSoon.text")}</p>
        <p className="mt-1 text-muted">
          {t("comingSoon.feedbackPrompt")}{" "}
          <Link href="/feedback/" className="font-semibold underline underline-offset-4">
            {t("comingSoon.feedbackLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
