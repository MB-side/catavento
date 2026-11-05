// A page that moved (D93): forwards the browser straight away, with or without JavaScript, and shows
// a plain link in case it doesn't. React hoists the <meta> into the page head.
import Link from "next/link";
import { t } from "@/lib/messages";
import { withBasePath } from "@/lib/paths";

export function Forward({ to }: { to: string }) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${withBasePath(to)}`} />
      <meta name="robots" content="noindex" />
      <p className="text-[1.0625rem]" data-testid="forward">
        {t("forward.text")} <Link href={to}>{t("forward.link")}</Link>
      </p>
    </>
  );
}
